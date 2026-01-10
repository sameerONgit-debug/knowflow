"""
Conversation & Questioning Engine

Manages stateful questioning sessions with:
- Adaptive question selection
- Knowledge gap tracking
- Confidence aggregation
- Session state machine
"""

from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

from app.models import (
    Session, SessionPhase, Question, Response,
    KnowledgeEntity, EntityType, ConfidenceLevel
)
from app.ai import get_ai_client, QuestionGenerationResult


# =============================================================================
# SESSION STATE MANAGEMENT
# =============================================================================

class SessionState:
    """
    Tracks the complete state of a questioning session.
    This is the "memory" of the conversation.
    """
    
    def __init__(self, session: Session, process_name: str):
        self.session = session
        self.process_name = process_name
        
        # Questions asked in this session
        self.questions: List[Question] = []
        self.responses: List[Response] = []
        
        # Extracted knowledge
        self.entities: Dict[UUID, KnowledgeEntity] = {}
        self.entity_index: Dict[str, UUID] = {}  # name -> id for dedup
        
        # Tracking
        self.asked_intents: set = set()  # Track what we've asked about
        self.confidence_scores: Dict[str, float] = {}  # entity_name -> confidence
        
    def get_context_summary(self) -> str:
        """Generate a summary of what we know so far."""
        if not self.entities:
            return "No knowledge extracted yet."
        
        by_type: Dict[EntityType, List[str]] = {}
        for entity in self.entities.values():
            if entity.entity_type not in by_type:
                by_type[entity.entity_type] = []
            by_type[entity.entity_type].append(entity.name)
        
        summary_parts = []
        for etype, names in by_type.items():
            summary_parts.append(f"{etype.value}s: {', '.join(names)}")
        
        return "; ".join(summary_parts)
    
    def get_knowledge_gaps(self) -> List[str]:
        """Identify what's missing based on what we know."""
        gaps = []
        
        # Check for tasks without owners
        tasks = [e for e in self.entities.values() if e.entity_type == EntityType.TASK]
        roles = [e for e in self.entities.values() if e.entity_type == EntityType.ROLE]
        
        if tasks and not roles:
            gaps.append("No roles/owners defined for tasks")
        
        # Check for decisions without conditions
        decisions = [e for e in self.entities.values() if e.entity_type == EntityType.DECISION]
        for d in decisions:
            if not d.attributes.get("conditions"):
                gaps.append(f"Decision '{d.name}' has no defined conditions")
        
        # Check for missing triggers
        if tasks and not any(e.entity_type == EntityType.TRIGGER for e in self.entities.values()):
            gaps.append("No triggers defined - what starts this process?")
        
        # Check for missing outputs
        if tasks and not any(e.entity_type == EntityType.ARTIFACT for e in self.entities.values()):
            gaps.append("No artifacts/outputs defined - what does this process produce?")
        
        # Low confidence items that need verification
        low_conf = [
            e.name for e in self.entities.values()
            if e.confidence_score < 0.6
        ]
        if low_conf:
            gaps.append(f"Need clarification on: {', '.join(low_conf)}")
        
        return gaps
    
    def add_entity(self, entity: KnowledgeEntity) -> KnowledgeEntity:
        """Add or merge an entity into the known set."""
        # Deduplicate by name (case-insensitive)
        key = entity.name.lower().strip()
        
        if key in self.entity_index:
            # Merge with existing entity (update if higher confidence)
            existing_id = self.entity_index[key]
            existing = self.entities[existing_id]
            
            if entity.confidence_score > existing.confidence_score:
                entity.id = existing_id  # Keep same ID
                self.entities[existing_id] = entity
            
            return self.entities[existing_id]
        else:
            self.entity_index[key] = entity.id
            self.entities[entity.id] = entity
            return entity
    
    def get_previous_questions(self) -> List[str]:
        """Get text of previous questions for context."""
        return [q.text for q in self.questions]


# =============================================================================
# QUESTION GENERATION ENGINE
# =============================================================================

class QuestionEngine:
    """
    Generates adaptive questions based on session state.
    Combines rule-based logic with AI for intelligent questioning.
    """
    
    # Standard questions for each phase
    PHASE_TEMPLATES = {
        SessionPhase.ONBOARDING: [
            "Can you give me a high-level overview of this process? What's its main purpose?",
            "Who are the main people or teams involved in this process?",
            "What triggers this process to start?",
            "What is the final output or deliverable of this process?",
        ],
        SessionPhase.DEEP_DIVE: [
            "Let's break this down step by step. What's the very first thing that happens?",
            "What happens after {last_step}? What's the next step?",
            "Are there any decision points where the process could go different ways?",
            "What tools or systems are used during this process?",
        ],
        SessionPhase.CLARIFICATION: [
            "You mentioned {entity}. Can you explain that in more detail?",
            "I'm not clear on {ambiguity}. Could you clarify?",
            "What happens if {condition} is not met?",
        ],
        SessionPhase.VALIDATION: [
            "Let me confirm: {summary}. Is that correct?",
            "Have I missed anything important?",
            "Are there any exceptions or edge cases we haven't covered?",
        ],
    }
    
    def __init__(self):
        self.ai_client = None  # Lazy init
    
    async def get_next_question(
        self,
        state: SessionState,
        use_ai: bool = True
    ) -> Question:
        """
        Generate the next best question to ask.
        
        Uses a hybrid approach:
        1. Rule-based selection for standard cases
        2. AI generation for complex/adaptive cases
        """
        # Determine if we should transition phases
        new_phase = self._evaluate_phase_transition(state)
        if new_phase != state.session.phase:
            state.session.phase = new_phase
        
        phase = state.session.phase
        
        # For early phase, use templates
        if phase == SessionPhase.ONBOARDING and len(state.questions) < 4:
            return self._generate_template_question(state, phase)
        
        # For later phases or complex cases, use AI
        if use_ai:
            try:
                if self.ai_client is None:
                    self.ai_client = get_ai_client()
                
                ai_result = await self.ai_client.generate_question(
                    process_name=state.process_name,
                    session_phase=phase.value,
                    known_summary=state.get_context_summary(),
                    gaps=state.get_knowledge_gaps(),
                    prev_questions=state.get_previous_questions(),
                    last_response=state.responses[-1].raw_text if state.responses else ""
                )
                
                return self._create_question_from_ai(state, ai_result)
            except Exception:
                # Fallback to templates
                return self._generate_template_question(state, phase)
        
        return self._generate_template_question(state, phase)
    
    def _evaluate_phase_transition(self, state: SessionState) -> SessionPhase:
        """Determine if the session should move to a new phase."""
        current = state.session.phase
        
        if current == SessionPhase.ONBOARDING:
            # Move to deep dive after we have basic context
            if len(state.entities) >= 3 and state.session.questions_asked >= 4:
                return SessionPhase.DEEP_DIVE
        
        elif current == SessionPhase.DEEP_DIVE:
            # Move to clarification if we have many low-confidence items
            low_conf_count = sum(
                1 for e in state.entities.values()
                if e.confidence_score < 0.6
            )
            if low_conf_count >= 3:
                return SessionPhase.CLARIFICATION
            
            # Move to validation if we seem complete
            if len(state.entities) >= 10 and state.session.questions_asked >= 15:
                return SessionPhase.VALIDATION
        
        elif current == SessionPhase.CLARIFICATION:
            # Move to validation after addressing ambiguities
            low_conf_count = sum(
                1 for e in state.entities.values()
                if e.confidence_score < 0.6
            )
            if low_conf_count < 2:
                return SessionPhase.VALIDATION
        
        return current
    
    def _generate_template_question(
        self,
        state: SessionState,
        phase: SessionPhase
    ) -> Question:
        """Generate a question from templates."""
        templates = self.PHASE_TEMPLATES.get(phase, [])
        
        # Find an unasked template
        for template in templates:
            # Simple template - no variables
            if "{" not in template and template not in state.get_previous_questions():
                return Question(
                    id=uuid4(),
                    session_id=state.session.id,
                    text=template,
                    intent=f"{phase.value}_standard",
                    sequence_number=len(state.questions) + 1,
                    priority=0.7,
                    is_followup=False
                )
        
        # Default fallback
        return Question(
            id=uuid4(),
            session_id=state.session.id,
            text="What else should I know about this process?",
            intent="open_exploration",
            sequence_number=len(state.questions) + 1,
            priority=0.5,
            is_followup=False
        )
    
    def _create_question_from_ai(
        self,
        state: SessionState,
        ai_result: QuestionGenerationResult
    ) -> Question:
        """Create a Question object from AI generation result."""
        target_type = None
        if ai_result.target_entity_type:
            try:
                target_type = EntityType(ai_result.target_entity_type)
            except ValueError:
                pass
        
        return Question(
            id=uuid4(),
            session_id=state.session.id,
            text=ai_result.question_text,
            intent=ai_result.intent,
            target_entity_type=target_type,
            sequence_number=len(state.questions) + 1,
            priority=ai_result.priority,
            is_followup=ai_result.is_followup
        )


# =============================================================================
# SESSION MANAGER (Orchestrator)
# =============================================================================

class ConversationManager:
    """
    High-level manager for conversation sessions.
    Coordinates между question engine and session state.
    """
    
    def __init__(self):
        self.active_sessions: Dict[UUID, SessionState] = {}
        self.question_engine = QuestionEngine()
    
    def start_session(
        self,
        process_id: UUID,
        process_name: str,
        initial_context: Optional[str] = None
    ) -> Session:
        """Start a new questioning session."""
        session = Session(
            process_id=process_id,
            phase=SessionPhase.ONBOARDING,
            context_summary=initial_context or ""
        )
        
        state = SessionState(session, process_name)
        self.active_sessions[session.id] = state
        
        return session
    
    def get_session_state(self, session_id: UUID) -> Optional[SessionState]:
        """Retrieve the state of an active session."""
        return self.active_sessions.get(session_id)
    
    async def get_next_question(self, session_id: UUID) -> Optional[Question]:
        """Get the next question for a session."""
        state = self.active_sessions.get(session_id)
        if not state:
            return None
        
        question = await self.question_engine.get_next_question(state)
        state.questions.append(question)
        state.session.questions_asked += 1
        
        return question
    
    def record_response(
        self,
        session_id: UUID,
        question_id: UUID,
        raw_text: str
    ) -> Response:
        """Record a user's response to a question."""
        state = self.active_sessions.get(session_id)
        if not state:
            raise ValueError(f"Session {session_id} not found")
        
        response = Response(
            question_id=question_id,
            session_id=session_id,
            raw_text=raw_text
        )
        
        state.responses.append(response)
        state.session.responses_received += 1
        
        # Mark question as answered
        for q in state.questions:
            if q.id == question_id:
                q.answered_at = datetime.utcnow()
                break
        
        return response
    
    def add_extracted_entities(
        self,
        session_id: UUID,
        entities: List[KnowledgeEntity]
    ):
        """Add extracted entities to session state."""
        state = self.active_sessions.get(session_id)
        if not state:
            return
        
        for entity in entities:
            state.add_entity(entity)
            state.session.entities_extracted += 1
    
    def end_session(self, session_id: UUID) -> Optional[Session]:
        """End a session and return final state."""
        state = self.active_sessions.get(session_id)
        if not state:
            return None
        
        state.session.phase = SessionPhase.COMPLETE
        state.session.ended_at = datetime.utcnow()
        
        # Clean up but keep for retrieval
        return state.session


# Singleton instance
_manager: Optional[ConversationManager] = None

def get_conversation_manager() -> ConversationManager:
    """Get or create the conversation manager singleton."""
    global _manager
    if _manager is None:
        _manager = ConversationManager()
    return _manager
