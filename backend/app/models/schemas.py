"""
KnowFlow Data Models

Production-grade schemas for all core entities.
All models are immutable where possible and use strict typing.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from uuid import UUID, uuid4


# =============================================================================
# ENUMERATIONS
# =============================================================================

class ProcessStatus(str, Enum):
    """Lifecycle states for a process being documented."""
    DRAFT = "draft"           # Initial creation, no data yet
    CAPTURING = "capturing"   # Active questioning sessions
    VALIDATING = "validating" # Human review of extracted knowledge
    PUBLISHED = "published"   # Finalized and locked
    ARCHIVED = "archived"     # Soft-deleted


class SessionPhase(str, Enum):
    """Phases of an AI-led questioning session."""
    ONBOARDING = "onboarding"     # Initial context gathering
    DEEP_DIVE = "deep_dive"       # Detailed step-by-step extraction
    CLARIFICATION = "clarification"  # Resolving ambiguities
    VALIDATION = "validation"     # Confirming extracted knowledge
    COMPLETE = "complete"         # Session ended


class EntityType(str, Enum):
    """Types of knowledge entities that can be extracted."""
    TASK = "task"           # An action or step in the process
    ROLE = "role"           # A person or team responsible for tasks
    TRIGGER = "trigger"     # An event that initiates a task
    DECISION = "decision"   # A branching point with conditions
    ARTIFACT = "artifact"   # A document, form, or output
    SYSTEM = "system"       # An external system or tool
    RULE = "rule"           # A business rule or constraint


class RelationType(str, Enum):
    """Types of relationships between entities."""
    DEPENDS_ON = "depends_on"       # Task A requires Task B completion
    TRIGGERS = "triggers"           # Event A initiates Task B
    OWNED_BY = "owned_by"           # Task is owned by Role
    PRODUCES = "produces"           # Task produces Artifact
    CONSUMES = "consumes"           # Task requires Artifact as input
    DECIDES = "decides"             # Decision leads to different paths
    ESCALATES_TO = "escalates_to"   # Exception handling path
    VALIDATES = "validates"         # Role validates Artifact/Task


class RiskSeverity(str, Enum):
    """Severity levels for identified risks."""
    CRITICAL = "critical"  # Immediate action required
    HIGH = "high"          # Should be addressed before go-live
    MEDIUM = "medium"      # Should be documented and monitored
    LOW = "low"            # Informational, nice to fix


class RiskCategory(str, Enum):
    """Categories of process risks."""
    SINGLE_POINT_OF_FAILURE = "single_point_of_failure"
    UNDOCUMENTED_DECISION = "undocumented_decision"
    ORPHANED_TASK = "orphaned_task"
    BRITTLE_CHAIN = "brittle_chain"
    MISSING_EXCEPTION_HANDLER = "missing_exception_handler"
    CIRCULAR_DEPENDENCY = "circular_dependency"
    BOTTLENECK = "bottleneck"


class ConfidenceLevel(str, Enum):
    """Qualitative confidence in extracted information."""
    HIGH = "high"       # Explicitly stated by user
    MEDIUM = "medium"   # Inferred with strong context
    LOW = "low"         # Inferred with weak context
    UNVERIFIED = "unverified"  # AI-generated, needs confirmation


# =============================================================================
# AUTH MODELS
# =============================================================================

class User(BaseModel):
    """System user for authentication."""
    id: UUID = Field(default_factory=uuid4)
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    email: str  # Made mandatory
    employee_id: str
    role: str
    department: str
    experience_years: float
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    """API Access Token."""
    access_token: str
    token_type: str
    user_id: UUID
    username: str

# =============================================================================
# CORE ENTITIES
# =============================================================================

class Process(BaseModel):
    """
    A business process being documented.
    This is the top-level container for all knowledge extraction.
    """
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    department: Optional[str] = None
    owner_id: UUID  # Reference to user ID (Required now)
    status: ProcessStatus = ProcessStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    current_graph_version: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Loan Approval Process",
                "description": "End-to-end workflow for processing loan applications",
                "department": "Finance",
                "status": "capturing"
            }
        }


class Session(BaseModel):
    """
    A stateful questioning session for knowledge extraction.
    Tracks context, progress, and what has been learned.
    """
    id: UUID = Field(default_factory=uuid4)
    process_id: UUID
    phase: SessionPhase = SessionPhase.ONBOARDING
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    
    # Tracking state
    questions_asked: int = 0
    responses_received: int = 0
    entities_extracted: int = 0
    
    # Context buffer - what the AI "remembers" for this session
    context_summary: str = ""
    known_entities: List[str] = Field(default_factory=list)  # Entity IDs
    knowledge_gaps: List[str] = Field(default_factory=list)  # Missing info
    
    # Current focus area
    current_focus: Optional[str] = None  # e.g., "exception_handling"
    focus_stack: List[str] = Field(default_factory=list)  # For nested exploration
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Question(BaseModel):
    """
    A question generated by the adaptive questioning engine.
    Questions are tracked for analytics and session continuity.
    """
    id: UUID = Field(default_factory=uuid4)
    session_id: UUID
    
    # Question content
    text: str
    intent: str  # What knowledge we're trying to extract
    target_entity_type: Optional[EntityType] = None
    
    # Ordering and priority
    sequence_number: int
    priority: float = Field(ge=0.0, le=1.0, default=0.5)
    
    # Categorization
    is_followup: bool = False
    parent_question_id: Optional[UUID] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    answered_at: Optional[datetime] = None


class Response(BaseModel):
    """
    A user's response to a question.
    Raw text plus any extracted structures.
    """
    id: UUID = Field(default_factory=uuid4)
    question_id: UUID
    session_id: UUID
    
    # Raw input
    raw_text: str
    
    # Extraction results (populated by pipeline)
    extracted_entities: List[UUID] = Field(default_factory=list)
    extracted_relations: List[UUID] = Field(default_factory=list)
    
    # Quality metrics
    clarity_score: float = Field(ge=0.0, le=1.0, default=0.5)
    completeness_score: float = Field(ge=0.0, le=1.0, default=0.5)
    
    # Flags
    needs_clarification: bool = False
    clarification_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class KnowledgeEntity(BaseModel):
    """
    A structured piece of knowledge extracted from user responses.
    This is the atomic unit of the knowledge graph.
    """
    id: UUID = Field(default_factory=uuid4)
    process_id: UUID
    
    # Core identity
    entity_type: EntityType
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    
    # Confidence and provenance
    confidence: ConfidenceLevel = ConfidenceLevel.UNVERIFIED
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.5)
    source_response_ids: List[UUID] = Field(default_factory=list)
    
    # For verification flow
    verified: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    
    # Type-specific attributes
    attributes: Dict[str, Any] = Field(default_factory=dict)
    """
    Examples by type:
    - TASK: {"duration_estimate": "2 hours", "frequency": "daily"}
    - ROLE: {"department": "Finance", "seniority": "Senior"}
    - DECISION: {"conditions": ["amount > 10000", "risk_score > 0.7"]}
    - TRIGGER: {"event_type": "form_submission", "source": "web_portal"}
    """
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# =============================================================================
# GRAPH MODELS
# =============================================================================

class GraphNode(BaseModel):
    """
    A node in the process graph.
    Wraps a KnowledgeEntity with graph-specific properties.
    """
    id: UUID = Field(default_factory=uuid4)
    entity_id: UUID  # Reference to KnowledgeEntity
    graph_version: int
    
    # Visual/layout properties (client can override)
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    
    # Graph metrics (computed)
    in_degree: int = 0   # Number of incoming edges
    out_degree: int = 0  # Number of outgoing edges
    centrality: float = 0.0  # Importance in graph
    
    # Clustering
    cluster_id: Optional[str] = None
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    """
    An edge (relationship) in the process graph.
    """
    id: UUID = Field(default_factory=uuid4)
    graph_version: int
    
    # Connection
    source_node_id: UUID
    target_node_id: UUID
    relation_type: RelationType
    
    # Edge properties
    label: Optional[str] = None  # e.g., "Yes", "No" for decisions
    weight: float = 1.0  # For weighted graph algorithms
    
    # Confidence
    confidence: ConfidenceLevel = ConfidenceLevel.UNVERIFIED
    source_response_ids: List[UUID] = Field(default_factory=list)
    
    # Conditions (for decision edges)
    conditions: List[str] = Field(default_factory=list)
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphVersion(BaseModel):
    """
    A versioned snapshot of the process graph.
    Enables diffing and rollback.
    """
    id: UUID = Field(default_factory=uuid4)
    process_id: UUID
    version_number: int
    
    # Snapshot data
    node_count: int = 0
    edge_count: int = 0
    
    # Change tracking
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None  # User or "system"
    change_summary: str = ""
    
    # Nodes and edges added/removed from previous version
    nodes_added: List[UUID] = Field(default_factory=list)
    nodes_removed: List[UUID] = Field(default_factory=list)
    edges_added: List[UUID] = Field(default_factory=list)
    edges_removed: List[UUID] = Field(default_factory=list)


# =============================================================================
# OUTPUT MODELS
# =============================================================================

class SOPStep(BaseModel):
    """A single step in a Standard Operating Procedure."""
    step_number: int
    title: str
    description: str
    responsible_role: Optional[str] = None
    
    # Provenance - which nodes contributed to this step
    source_node_ids: List[UUID] = Field(default_factory=list)
    
    # Flags
    is_decision_point: bool = False
    is_exception_handler: bool = False
    
    # For decision points
    branches: Optional[Dict[str, int]] = None  # condition -> next step number
    
    notes: List[str] = Field(default_factory=list)


class SOPVersion(BaseModel):
    """
    A generated Standard Operating Procedure document.
    """
    id: UUID = Field(default_factory=uuid4)
    process_id: UUID
    version_number: int
    
    # Document content
    title: str
    purpose: str
    scope: str
    steps: List[SOPStep] = Field(default_factory=list)
    
    # Metadata sections
    roles_involved: List[str] = Field(default_factory=list)
    systems_referenced: List[str] = Field(default_factory=list)
    artifacts_produced: List[str] = Field(default_factory=list)
    
    # Quality metrics
    coverage_score: float = Field(ge=0.0, le=1.0)  # % of graph covered
    confidence_score: float = Field(ge=0.0, le=1.0)  # Avg confidence
    
    # Generation metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    source_graph_version: int
    generation_params: Dict[str, Any] = Field(default_factory=dict)


class RiskFinding(BaseModel):
    """
    A risk or issue identified in the process graph.
    """
    id: UUID = Field(default_factory=uuid4)
    process_id: UUID
    
    # Classification
    category: RiskCategory
    severity: RiskSeverity
    
    # Description
    title: str
    description: str
    explanation: str  # Why this is a risk
    
    # Location in graph
    affected_node_ids: List[UUID] = Field(default_factory=list)
    affected_edge_ids: List[UUID] = Field(default_factory=list)
    
    # Recommendation
    recommendation: str
    effort_estimate: Optional[str] = None  # "low", "medium", "high"
    
    # Status tracking
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved: bool = False
    
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None


# =============================================================================
# API REQUEST/RESPONSE MODELS
# =============================================================================

class CreateProcessRequest(BaseModel):
    """Request body for creating a new process."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    department: Optional[str] = None


class StartSessionRequest(BaseModel):
    """Request body for starting a new questioning session."""
    initial_context: Optional[str] = None
    focus_area: Optional[str] = None


class SubmitResponseRequest(BaseModel):
    """Request body for submitting a response to a question."""
    response_text: str = Field(..., min_length=1)


class GenerateSOPRequest(BaseModel):
    """Request body for SOP generation with options."""
    include_exceptions: bool = True
    include_systems: bool = True
    detail_level: str = "standard"  # "brief", "standard", "detailed"


class AnalyzeRisksRequest(BaseModel):
    """Request body for risk analysis with options."""
    categories: Optional[List[RiskCategory]] = None  # Filter by category
    min_severity: RiskSeverity = RiskSeverity.LOW


# =============================================================================
# GRAPH DIFF MODEL
# =============================================================================

class GraphDiff(BaseModel):
    """Represents differences between two graph versions."""
    from_version: int
    to_version: int
    
    nodes_added: List[KnowledgeEntity] = Field(default_factory=list)
    nodes_removed: List[KnowledgeEntity] = Field(default_factory=list)
    nodes_modified: List[Dict[str, Any]] = Field(default_factory=list)
    
    edges_added: List[GraphEdge] = Field(default_factory=list)
    edges_removed: List[GraphEdge] = Field(default_factory=list)
    edges_modified: List[Dict[str, Any]] = Field(default_factory=list)
    
    summary: str = ""
