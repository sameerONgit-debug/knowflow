"""
Session API Endpoints

Handles questioning sessions, adaptive question generation, and response ingestion.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.models import (
    Session, SessionPhase, Question, Response,
    KnowledgeEntity, StartSessionRequest, SubmitResponseRequest, User
)
from app.services import get_conversation_manager, get_extraction_pipeline
from app.graph import get_graph_store
from app.api.processes import get_process_or_404
from app.core.auth import get_current_user


router = APIRouter(prefix="/sessions", tags=["Sessions"])


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class SessionResponse(BaseModel):
    """API response for session data."""
    id: UUID
    process_id: UUID
    phase: SessionPhase
    started_at: datetime
    ended_at: Optional[datetime]
    questions_asked: int
    responses_received: int
    entities_extracted: int
    context_summary: str
    knowledge_gaps: List[str]


class QuestionResponse(BaseModel):
    """API response for a generated question."""
    id: UUID
    text: str
    intent: str
    target_entity_type: Optional[str]
    sequence_number: int
    priority: float
    is_followup: bool


class ResponseAck(BaseModel):
    """Acknowledgment of response submission."""
    response_id: UUID
    entities_extracted: int
    needs_clarification: bool
    clarification_reason: Optional[str]
    session_phase: SessionPhase


class KnowledgeStateResponse(BaseModel):
    """API response for session knowledge state."""
    session_id: UUID
    total_entities: int
    entities_by_type: Dict[str, int]
    knowledge_gaps: List[str]
    confidence_distribution: Dict[str, int]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/{process_id}/sessions", response_model=SessionResponse, status_code=201)
async def start_session(
    process_id: UUID, 
    request: StartSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Start a new questioning session for a process.
    """
    process = get_process_or_404(process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this process")
    
    manager = get_conversation_manager()
    session = manager.start_session(
        process_id=process_id,
        process_name=process.name,
        initial_context=request.initial_context
    )
    
    state = manager.get_session_state(session.id)
    
    return SessionResponse(
        id=session.id,
        process_id=session.process_id,
        phase=session.phase,
        started_at=session.started_at,
        ended_at=session.ended_at,
        questions_asked=session.questions_asked,
        responses_received=session.responses_received,
        entities_extracted=session.entities_extracted,
        context_summary=session.context_summary,
        knowledge_gaps=state.get_knowledge_gaps() if state else []
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Get the current state of a session.
    """
    manager = get_conversation_manager()
    state = manager.get_session_state(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Auth check
    process = get_process_or_404(state.session.process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session = state.session
    return SessionResponse(
        id=session.id,
        process_id=session.process_id,
        phase=session.phase,
        started_at=session.started_at,
        ended_at=session.ended_at,
        questions_asked=session.questions_asked,
        responses_received=session.responses_received,
        entities_extracted=session.entities_extracted,
        context_summary=state.get_context_summary(),
        knowledge_gaps=state.get_knowledge_gaps()
    )


@router.get("/{session_id}/next-question", response_model=QuestionResponse)
async def get_next_question(
    session_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Get the next adaptive question for the session.
    """
    manager = get_conversation_manager()
    # Check existence and auth via state
    state = manager.get_session_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    process = get_process_or_404(state.session.process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    question = await manager.get_next_question(session_id)
    
    if not question:
        raise HTTPException(status_code=404, detail="Session completed or error generating question")
    
    return QuestionResponse(
        id=question.id,
        text=question.text,
        intent=question.intent,
        target_entity_type=question.target_entity_type.value if question.target_entity_type else None,
        sequence_number=question.sequence_number,
        priority=question.priority,
        is_followup=question.is_followup
    )


@router.post("/{session_id}/responses", response_model=ResponseAck)
async def submit_response(
    session_id: UUID, 
    request: SubmitResponseRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submit a user's response to a question.
    """
    manager = get_conversation_manager()
    state = manager.get_session_state(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    process = get_process_or_404(state.session.process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the last question (assumes sequential Q&A)
    if not state.questions:
        raise HTTPException(status_code=400, detail="No questions to answer")
    
    last_question = state.questions[-1]
    
    # Record the response
    response = manager.record_response(
        session_id=session_id,
        question_id=last_question.id,
        raw_text=request.response_text
    )
    
    # Extract knowledge
    pipeline = get_extraction_pipeline()
    entities, pending_relations = await pipeline.extract_from_response(
        response=response,
        process_id=state.session.process_id,
        context=state.get_context_summary()
    )
    
    # Add entities to session state
    manager.add_extracted_entities(session_id, entities)
    
    # Add to graph
    graph_store = get_graph_store()
    graph = graph_store.get_graph(state.session.process_id)
    
    if graph:
        entity_lookup = {}
        for entity in entities:
            graph.add_entity(entity)
            entity_lookup[entity.name.lower()] = entity.id
        
        # Merge with existing entities
        for existing in graph.entities.values():
            entity_lookup[existing.name.lower()] = existing.id
        
        # Resolve relations
        edges = pipeline.resolve_relations(
            pending_relations=pending_relations,
            entity_lookup=entity_lookup,
            response_id=response.id,
            graph_version=graph.current_version
        )
        
        for edge in edges:
            graph.add_edge(edge)
    
    return ResponseAck(
        response_id=response.id,
        entities_extracted=len(entities),
        needs_clarification=response.needs_clarification,
        clarification_reason=response.clarification_reason,
        session_phase=state.session.phase
    )


@router.get("/{session_id}/knowledge-state", response_model=KnowledgeStateResponse)
async def get_knowledge_state(
    session_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Get the current knowledge state of the session.
    """
    manager = get_conversation_manager()
    state = manager.get_session_state(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    process = get_process_or_404(state.session.process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Count entities by type
    by_type: Dict[str, int] = {}
    confidence_dist: Dict[str, int] = {"high": 0, "medium": 0, "low": 0, "unverified": 0}
    
    for entity in state.entities.values():
        type_name = entity.entity_type.value
        by_type[type_name] = by_type.get(type_name, 0) + 1
        
        if entity.confidence_score >= 0.8:
            confidence_dist["high"] += 1
        elif entity.confidence_score >= 0.6:
            confidence_dist["medium"] += 1
        elif entity.confidence_score >= 0.3:
            confidence_dist["low"] += 1
        else:
            confidence_dist["unverified"] += 1
    
    return KnowledgeStateResponse(
        session_id=session_id,
        total_entities=len(state.entities),
        entities_by_type=by_type,
        knowledge_gaps=state.get_knowledge_gaps(),
        confidence_distribution=confidence_dist
    )


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    End a questioning session.
    """
    manager = get_conversation_manager()
    # Check auth before ending
    state = manager.get_session_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    process = get_process_or_404(state.session.process_id)
    if process.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    session = manager.end_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create graph snapshot
    graph_store = get_graph_store()
    graph = graph_store.get_graph(session.process_id)
    if graph:
        graph.create_snapshot("Session completed")
    
    return SessionResponse(
        id=session.id,
        process_id=session.process_id,
        phase=session.phase,
        started_at=session.started_at,
        ended_at=session.ended_at,
        questions_asked=session.questions_asked,
        responses_received=session.responses_received,
        entities_extracted=session.entities_extracted,
        context_summary=session.context_summary,
        knowledge_gaps=[]
    )
