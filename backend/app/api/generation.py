"""
Generation & Analysis API Endpoints

Handles SOP generation and risk analysis.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.models import (
    SOPVersion, RiskFinding, RiskCategory, RiskSeverity,
    GenerateSOPRequest, AnalyzeRisksRequest, User
)
from app.services import get_sop_generator, SOPExporter, get_risk_analyzer
from app.graph import get_graph_store
from app.api.processes import get_process_or_404
from app.core.auth import get_current_user


router = APIRouter(prefix="/processes/{process_id}", tags=["Generation & Analysis"])


# =============================================================================
# IN-MEMORY STORAGE
# =============================================================================

sop_storage: Dict[UUID, List[SOPVersion]] = {}  # process_id -> [versions]
risk_storage: Dict[UUID, List[RiskFinding]] = {}  # process_id -> [findings]


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class SOPResponse(BaseModel):
    """API response for SOP data."""
    id: UUID
    version_number: int
    title: str
    purpose: str
    scope: str
    roles_involved: List[str]
    systems_referenced: List[str]
    step_count: int
    coverage_score: float
    confidence_score: float
    generated_at: datetime
    source_graph_version: int


class SOPDetailResponse(BaseModel):
    """Full SOP with steps."""
    id: UUID
    version_number: int
    title: str
    purpose: str
    scope: str
    roles_involved: List[str]
    systems_referenced: List[str]
    artifacts_produced: List[str]
    steps: List[Dict[str, Any]]
    coverage_score: float
    confidence_score: float
    generated_at: datetime
    markdown: str


class RiskFindingResponse(BaseModel):
    """API response for a risk finding."""
    id: UUID
    category: str
    severity: str
    title: str
    description: str
    explanation: str
    recommendation: str
    effort_estimate: Optional[str]
    affected_node_count: int
    acknowledged: bool
    resolved: bool


class RiskAnalysisResponse(BaseModel):
    """API response for risk analysis results."""
    process_id: UUID
    total_risks: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    findings: List[RiskFindingResponse]
    analyzed_at: datetime


# =============================================================================
# SOP ENDPOINTS
# =============================================================================

@router.post("/sop/generate", response_model=SOPResponse)
async def generate_sop(
    process_id: UUID, 
    request: GenerateSOPRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a Standard Operating Procedure from the process graph.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    graph_store = get_graph_store()
    graph = graph_store.get_graph(process_id)
    
    if not graph or not graph.entities:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate SOP: Process graph is empty. Start a questioning session first."
        )
    
    generator = get_sop_generator()
    sop = generator.generate(
        graph=graph,
        include_exceptions=request.include_exceptions,
        include_systems=request.include_systems,
        detail_level=request.detail_level
    )
    
    # Determine version number
    existing = sop_storage.get(process_id, [])
    sop.version_number = len(existing) + 1
    
    # Store
    if process_id not in sop_storage:
        sop_storage[process_id] = []
    sop_storage[process_id].append(sop)
    
    return SOPResponse(
        id=sop.id,
        version_number=sop.version_number,
        title=sop.title,
        purpose=sop.purpose,
        scope=sop.scope,
        roles_involved=sop.roles_involved,
        systems_referenced=sop.systems_referenced,
        step_count=len(sop.steps),
        coverage_score=sop.coverage_score,
        confidence_score=sop.confidence_score,
        generated_at=sop.generated_at,
        source_graph_version=sop.source_graph_version
    )


@router.get("/sop/latest", response_model=SOPDetailResponse)
async def get_latest_sop(
    process_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Get the latest generated SOP for a process.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    versions = sop_storage.get(process_id, [])
    if not versions:
        raise HTTPException(status_code=404, detail="No SOP generated yet")
    
    sop = versions[-1]
    markdown = SOPExporter.to_markdown(sop)
    
    return SOPDetailResponse(
        id=sop.id,
        version_number=sop.version_number,
        title=sop.title,
        purpose=sop.purpose,
        scope=sop.scope,
        roles_involved=sop.roles_involved,
        systems_referenced=sop.systems_referenced,
        artifacts_produced=sop.artifacts_produced,
        steps=[
            {
                "step_number": s.step_number,
                "title": s.title,
                "description": s.description,
                "responsible_role": s.responsible_role,
                "is_decision_point": s.is_decision_point,
                "is_exception_handler": s.is_exception_handler,
                "notes": s.notes,
                "branches": s.branches
            }
            for s in sop.steps
        ],
        coverage_score=sop.coverage_score,
        confidence_score=sop.confidence_score,
        generated_at=sop.generated_at,
        markdown=markdown
    )


@router.get("/sop/versions")
async def list_sop_versions(
    process_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    List all SOP versions for a process.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    versions = sop_storage.get(process_id, [])
    
    return {
        "versions": [
            {
                "id": str(sop.id),
                "version_number": sop.version_number,
                "generated_at": sop.generated_at.isoformat(),
                "step_count": len(sop.steps),
                "confidence_score": sop.confidence_score
            }
            for sop in versions
        ],
        "total": len(versions)
    }


# =============================================================================
# RISK ANALYSIS ENDPOINTS
# =============================================================================

@router.post("/risks/analyze", response_model=RiskAnalysisResponse)
async def analyze_risks(
    process_id: UUID, 
    request: AnalyzeRisksRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Run risk analysis on the process graph.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    graph_store = get_graph_store()
    graph = graph_store.get_graph(process_id)
    
    if not graph or not graph.entities:
        raise HTTPException(
            status_code=400,
            detail="Cannot analyze risks: Process graph is empty."
        )
    
    analyzer = get_risk_analyzer()
    
    # Build node list for analysis
    nodes = list(graph.get_all_edges())  # Using edges implicitly gives us nodes
    
    # Map UUIDs to entities
    entity_map = {e.id: e for e in graph.entities.values()}
    
    findings = analyzer.analyze(
        entities=entity_map,
        nodes=[],  # Not needed with current implementation
        edges=graph.get_all_edges(),
        categories=request.categories,
        min_severity=request.min_severity
    )
    
    # Store findings
    risk_storage[process_id] = findings
    
    # Count by severity
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        counts[f.severity.value] += 1
    
    return RiskAnalysisResponse(
        process_id=process_id,
        total_risks=len(findings),
        critical_count=counts["critical"],
        high_count=counts["high"],
        medium_count=counts["medium"],
        low_count=counts["low"],
        findings=[
            RiskFindingResponse(
                id=f.id,
                category=f.category.value,
                severity=f.severity.value,
                title=f.title,
                description=f.description,
                explanation=f.explanation,
                recommendation=f.recommendation,
                effort_estimate=f.effort_estimate,
                affected_node_count=len(f.affected_node_ids),
                acknowledged=f.acknowledged,
                resolved=f.resolved
            )
            for f in findings
        ],
        analyzed_at=datetime.utcnow()
    )


@router.get("/risks", response_model=RiskAnalysisResponse)
async def get_risks(
    process_id: UUID, 
    current_user: User = Depends(get_current_user)
):
    """
    Get the latest risk analysis results.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    findings = risk_storage.get(process_id, [])
    
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        counts[f.severity.value] += 1
    
    return RiskAnalysisResponse(
        process_id=process_id,
        total_risks=len(findings),
        critical_count=counts["critical"],
        high_count=counts["high"],
        medium_count=counts["medium"],
        low_count=counts["low"],
        findings=[
            RiskFindingResponse(
                id=f.id,
                category=f.category.value,
                severity=f.severity.value,
                title=f.title,
                description=f.description,
                explanation=f.explanation,
                recommendation=f.recommendation,
                effort_estimate=f.effort_estimate,
                affected_node_count=len(f.affected_node_ids),
                acknowledged=f.acknowledged,
                resolved=f.resolved
            )
            for f in findings
        ],
        analyzed_at=datetime.utcnow()
    )


@router.patch("/risks/{risk_id}/acknowledge")
async def acknowledge_risk(
    process_id: UUID, 
    risk_id: UUID, 
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledge a risk finding.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    findings = risk_storage.get(process_id, [])
    
    for finding in findings:
        if finding.id == risk_id:
            finding.acknowledged = True
            if notes:
                finding.resolution_notes = notes
            return {"status": "acknowledged", "risk_id": str(risk_id)}
    
    raise HTTPException(status_code=404, detail="Risk finding not found")


@router.patch("/risks/{risk_id}/resolve")
async def resolve_risk(
    process_id: UUID, 
    risk_id: UUID, 
    resolution_notes: str,
    current_user: User = Depends(get_current_user)
):
    """
    Mark a risk as resolved.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    findings = risk_storage.get(process_id, [])
    
    for finding in findings:
        if finding.id == risk_id:
            finding.resolved = True
            finding.resolved_at = datetime.utcnow()
            finding.resolution_notes = resolution_notes
            return {"status": "resolved", "risk_id": str(risk_id)}
    
    raise HTTPException(status_code=404, detail="Risk finding not found")
