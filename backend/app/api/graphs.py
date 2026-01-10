"""
Graph API Endpoints

Handles process graph retrieval, versioning, and diff operations.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel

from app.models import GraphVersion, GraphDiff, User
from app.graph import get_graph_store
from app.api.processes import get_process_or_404
from app.core.auth import get_current_user


router = APIRouter(prefix="/processes/{process_id}/graph", tags=["Graph"])


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class GraphNodeResponse(BaseModel):
    """API response for a graph node."""
    id: str
    type: str
    label: str
    data: Dict[str, Any]


class GraphEdgeResponse(BaseModel):
    """API response for a graph edge."""
    id: str
    source: str
    target: str
    type: str
    label: Optional[str]
    data: Dict[str, Any]


class GraphResponse(BaseModel):
    """API response for the full graph."""
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]
    meta: Dict[str, Any]


class GraphVersionResponse(BaseModel):
    """API response for graph version info."""
    version_number: int
    node_count: int
    edge_count: int
    created_at: str
    change_summary: str


class GraphVersionListResponse(BaseModel):
    """API response for list of versions."""
    versions: List[GraphVersionResponse]
    current_version: int


class GraphDiffResponse(BaseModel):
    """API response for graph diff."""
    from_version: int
    to_version: int
    summary: str
    nodes_added: int
    nodes_removed: int
    edges_added: int
    edges_removed: int


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("", response_model=GraphResponse)
async def get_graph(
    process_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Get the current process graph.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    graph_store = get_graph_store()
    graph = graph_store.get_graph(process_id)
    
    if not graph:
        return GraphResponse(
            nodes=[],
            edges=[],
            meta={"version": 0, "nodeCount": 0, "edgeCount": 0}
        )
    
    viz_format = graph.to_visualization_format()
    
    return GraphResponse(
        nodes=[
            GraphNodeResponse(
                id=n["id"],
                type=n["type"],
                label=n["label"],
                data=n.get("data", {})
            )
            for n in viz_format["nodes"]
        ],
        edges=[
            GraphEdgeResponse(
                id=e["id"],
                source=e["source"],
                target=e["target"],
                type=e["type"],
                label=e.get("label"),
                data=e.get("data", {})
            )
            for e in viz_format["edges"]
        ],
        meta=viz_format["meta"]
    )


@router.get("/versions", response_model=GraphVersionListResponse)
async def list_graph_versions(
    process_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    List all versions of the process graph.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    graph_store = get_graph_store()
    graph = graph_store.get_graph(process_id)
    
    if not graph or not graph.versions:
        return GraphVersionListResponse(
            versions=[],
            current_version=0
        )
    
    return GraphVersionListResponse(
        versions=[
            GraphVersionResponse(
                version_number=v.version_number,
                node_count=v.node_count,
                edge_count=v.edge_count,
                created_at=v.created_at.isoformat(),
                change_summary=v.change_summary
            )
            for v in graph.versions.values()
        ],
        current_version=graph.current_version
    )


@router.post("/snapshot", response_model=GraphVersionResponse)
async def create_snapshot(
    process_id: UUID, 
    change_summary: str = "Manual snapshot",
    current_user: User = Depends(get_current_user)
):
    """
    Create a new version snapshot of the graph.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    graph_store = get_graph_store()
    graph = graph_store.get_graph(process_id)
    
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not initialized")
    
    version = graph.create_snapshot(change_summary)
    
    return GraphVersionResponse(
        version_number=version.version_number,
        node_count=version.node_count,
        edge_count=version.edge_count,
        created_at=version.created_at.isoformat(),
        change_summary=version.change_summary
    )


@router.get("/diff", response_model=GraphDiffResponse)
async def get_graph_diff(
    process_id: UUID,
    from_version: int = Query(..., description="Start version for diff"),
    to_version: int = Query(..., description="End version for diff"),
    current_user: User = Depends(get_current_user)
):
    """
    Compare two versions of the graph.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    graph_store = get_graph_store()
    graph = graph_store.get_graph(process_id)
    
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not initialized")
    
    if from_version not in graph.snapshots or to_version not in graph.snapshots:
        raise HTTPException(status_code=400, detail="One or both versions not found")
    
    diff = graph.compute_diff(from_version, to_version)
    
    return GraphDiffResponse(
        from_version=diff.from_version,
        to_version=diff.to_version,
        summary=diff.summary,
        nodes_added=len(diff.nodes_added),
        nodes_removed=len(diff.nodes_removed),
        edges_added=len(diff.edges_added),
        edges_removed=len(diff.edges_removed)
    )


@router.get("/analysis")
async def get_graph_analysis(
    process_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Get analytical insights about the graph structure.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    graph_store = get_graph_store()
    graph = graph_store.get_graph(process_id)
    
    if not graph or not graph.entities:
        return {
            "message": "Graph is empty or not initialized",
            "roots": [],
            "leaves": [],
            "centrality": {}
        }
    
    roots = graph.get_roots()
    leaves = graph.get_leaves()
    centrality = graph.compute_centrality()
    
    # Map IDs to names
    root_names = [graph.entities[r].name for r in roots if r in graph.entities]
    leaf_names = [graph.entities[l].name for l in leaves if l in graph.entities]
    
    # Top 5 most central nodes
    sorted_centrality = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:5]
    central_names = {
        graph.entities[k].name: v
        for k, v in sorted_centrality
        if k in graph.entities
    }
    
    return {
        "roots": root_names,
        "leaves": leaf_names,
        "top_central_nodes": central_names,
        "total_nodes": len(graph.entities),
        "total_edges": graph.graph.number_of_edges()
    }
