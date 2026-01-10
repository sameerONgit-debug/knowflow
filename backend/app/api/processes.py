"""
Process API Endpoints

Handles CRUD operations for processes and their lifecycle.
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel

from app.models.schemas import (
    Process, ProcessStatus, CreateProcessRequest, User
)
from app.graph import get_graph_store
from app.core.auth import get_current_user


router = APIRouter(prefix="/processes", tags=["Processes"])


# =============================================================================
# IN-MEMORY STORAGE (Replace with DB in production)
# =============================================================================

processes_db: dict[UUID, Process] = {}


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class ProcessResponse(BaseModel):
    """API response for process data."""
    id: UUID
    name: str
    description: Optional[str]
    department: Optional[str]
    status: ProcessStatus
    created_at: datetime
    updated_at: datetime
    current_graph_version: int


class ProcessListResponse(BaseModel):
    """API response for process list."""
    processes: List[ProcessResponse]
    total: int


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("", response_model=ProcessResponse, status_code=201)
async def create_process(
    request: CreateProcessRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new process for knowledge extraction.
    Scoped to the authenticated user.
    """
    process = Process(
        name=request.name,
        description=request.description,
        department=request.department,
        status=ProcessStatus.DRAFT,
        owner_id=current_user.id
    )
    
    # Store process
    processes_db[process.id] = process
    
    # Initialize empty graph
    graph_store = get_graph_store()
    graph_store.create_graph(process.id)
    
    return ProcessResponse(
        id=process.id,
        name=process.name,
        description=process.description,
        department=process.department,
        status=process.status,
        created_at=process.created_at,
        updated_at=process.updated_at,
        current_graph_version=process.current_graph_version
    )


@router.get("", response_model=ProcessListResponse)
async def list_processes(
    status: Optional[ProcessStatus] = Query(None, description="Filter by status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """
    List all processes owned by the current user.
    """
    # Filter by user ownership first
    user_processes = [p for p in processes_db.values() if p.owner_id == current_user.id]
    
    filtered = user_processes
    
    if status:
        filtered = [p for p in filtered if p.status == status]
    if department:
        filtered = [p for p in filtered if p.department == department]
    
    total = len(filtered)
    paginated = filtered[offset:offset + limit]
    
    return ProcessListResponse(
        processes=[
            ProcessResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                department=p.department,
                status=p.status,
                created_at=p.created_at,
                updated_at=p.updated_at,
                current_graph_version=p.current_graph_version
            )
            for p in paginated
        ],
        total=total
    )


@router.get("/{process_id}", response_model=ProcessResponse)
async def get_process(
    process_id: UUID, 
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific process by ID.
    Enforces ownership check.
    """
    if process_id not in processes_db:
        raise HTTPException(status_code=404, detail="Process not found")
    
    p = processes_db[process_id]
    
    if p.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this process")
    
    return ProcessResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        department=p.department,
        status=p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
        current_graph_version=p.current_graph_version
    )


@router.patch("/{process_id}", response_model=ProcessResponse)
async def update_process(
    process_id: UUID,
    name: Optional[str] = None,
    description: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[ProcessStatus] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Update process details.
    """
    if process_id not in processes_db:
        raise HTTPException(status_code=404, detail="Process not found")
    
    p = processes_db[process_id]
    
    if p.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this process")
    
    if name:
        p.name = name
    if description is not None:
        p.description = description
    if department is not None:
        p.department = department
    if status:
        p.status = status
    
    p.updated_at = datetime.utcnow()
    
    return ProcessResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        department=p.department,
        status=p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
        current_graph_version=p.current_graph_version
    )


@router.delete("/{process_id}", status_code=204)
async def delete_process(
    process_id: UUID, 
    current_user: User = Depends(get_current_user)
):
    """
    Archive a process (soft delete).
    """
    if process_id not in processes_db:
        raise HTTPException(status_code=404, detail="Process not found")
    
    p = processes_db[process_id]
    
    if p.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this process")
    
    # Soft delete - just mark as archived
    processes_db[process_id].status = ProcessStatus.ARCHIVED
    processes_db[process_id].updated_at = datetime.utcnow()
    
    # Also clean up graph store
    graph_store = get_graph_store()
    graph_store.delete_graph(process_id)


# =============================================================================
# HELPER FUNCTIONS (for other modules)
# =============================================================================

def get_process_or_404(process_id: UUID) -> Process:
    """Get a process or raise 404. WARNING: Does not check auth."""
    # This helper is typically used by internal services where auth is already handled
    # or by session endpoints which should also add auth checks.
    if process_id not in processes_db:
        raise HTTPException(status_code=404, detail="Process not found")
    return processes_db[process_id]
