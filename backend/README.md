# KnowFlow Backend

**Production-grade AI-powered organizational process intelligence system.**

## 🎯 Overview

KnowFlow extracts tacit operational knowledge from humans via adaptive AI-led questioning, converts responses into living process graphs, and continuously evolves SOPs, risks, and dependencies.

**This is NOT document ingestion-first. This is human knowledge extraction-first.**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER (FastAPI)                             │
│  /api/v1/processes  │  /api/v1/sessions  │  /api/v1/graph  │  /api/v1/sop  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
┌───────────────────┐  ┌──────────────────────┐  ┌────────────────────────────┐
│ CONVERSATION      │  │ EXTRACTION           │  │ GENERATION SERVICES        │
│ ENGINE            │  │ PIPELINE             │  │                            │
│ ─────────────────│  │ ────────────────────│  │ • SOP Generator            │
│ • Session State   │  │ • Entity Extraction  │  │ • Risk Analyzer            │
│ • Question Select │  │ • Relation Mapping   │  │ • Dependency Mapper        │
│ • Confidence Track│  │ • Schema Validation  │  │                            │
└───────────────────┘  └──────────────────────┘  └────────────────────────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROCESS GRAPH ENGINE (NetworkX)                     │
│  Version Control  │  Diff Engine  │  Traversal API  │  Visualization         │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI ORCHESTRATION (Gemini)                           │
│  Schema Validation  │  Confidence Scoring  │  Hallucination Guards          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run the Server

```bash
PYTHONPATH=$(pwd) uvicorn app.main:app --reload --port 8000
```

### 4. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📚 API Reference

### Process Management

#### Create Process
```bash
POST /api/v1/processes
Content-Type: application/json

{
    "name": "Loan Approval Process",
    "description": "End-to-end workflow for processing loan applications",
    "department": "Finance"
}

# Response
{
    "id": "2c7f2d58-6816-45bc-ba3a-927feb0830e0",
    "name": "Loan Approval Process",
    "status": "draft",
    "current_graph_version": 0
}
```

### Session & Questioning

#### Start Session
```bash
POST /api/v1/processes/{process_id}/sessions
Content-Type: application/json

{
    "initial_context": "This is our loan approval workflow"
}

# Response
{
    "id": "session-uuid",
    "phase": "onboarding",
    "questions_asked": 0,
    "knowledge_gaps": ["No triggers defined", "No artifacts defined"]
}
```

#### Get Next Question (Adaptive)
```bash
GET /api/v1/sessions/{session_id}/next-question

# Response
{
    "id": "question-uuid",
    "text": "Can you give me a high-level overview of this process? What's its main purpose?",
    "intent": "onboarding_standard",
    "priority": 0.7,
    "is_followup": false
}
```

#### Submit Response (Triggers Extraction)
```bash
POST /api/v1/sessions/{session_id}/responses
Content-Type: application/json

{
    "response_text": "The loan approval process starts when a customer submits an application. The loan officer reviews it, checks the credit score, and either approves or escalates to a senior manager for amounts over $50,000."
}

# Response
{
    "response_id": "response-uuid",
    "entities_extracted": 5,
    "needs_clarification": false,
    "session_phase": "deep_dive"
}
```

### Graph Operations

#### Get Process Graph
```bash
GET /api/v1/processes/{process_id}/graph

# Response
{
    "nodes": [
        {"id": "uuid1", "type": "task", "label": "Review Application"},
        {"id": "uuid2", "type": "decision", "label": "Amount > $50k?"},
        {"id": "uuid3", "type": "role", "label": "Loan Officer"}
    ],
    "edges": [
        {"source": "uuid1", "target": "uuid2", "type": "triggers"},
        {"source": "uuid1", "target": "uuid3", "type": "owned_by"}
    ],
    "meta": {"version": 1, "nodeCount": 3, "edgeCount": 2}
}
```

### Generation & Analysis

#### Generate SOP
```bash
POST /api/v1/processes/{process_id}/sop/generate
Content-Type: application/json

{
    "include_exceptions": true,
    "include_systems": true,
    "detail_level": "standard"
}

# Response
{
    "id": "sop-uuid",
    "version_number": 1,
    "title": "Standard Operating Procedure: Loan Application",
    "step_count": 8,
    "coverage_score": 0.92,
    "confidence_score": 0.78
}
```

#### Run Risk Analysis
```bash
POST /api/v1/processes/{process_id}/risks/analyze
Content-Type: application/json

{
    "min_severity": "medium"
}

# Response
{
    "total_risks": 3,
    "critical_count": 1,
    "high_count": 1,
    "medium_count": 1,
    "findings": [
        {
            "category": "circular_dependency",
            "severity": "critical",
            "title": "Circular Dependency Found",
            "description": "Cycle: Review → Approve → Notify → Review",
            "explanation": "Each task waits for another. Process will deadlock.",
            "recommendation": "Break the cycle by removing one dependency."
        }
    ]
}
```

## 🧠 Core Algorithms

### 1. Adaptive Questioning Engine

The system uses a **state machine** with four phases:

```
ONBOARDING → DEEP_DIVE → CLARIFICATION → VALIDATION → COMPLETE
```

**Phase Transitions:**
- **ONBOARDING → DEEP_DIVE**: After 3+ entities extracted, 4+ questions asked
- **DEEP_DIVE → CLARIFICATION**: When 3+ low-confidence items need resolution
- **DEEP_DIVE → VALIDATION**: When 10+ entities extracted, process seems complete
- **CLARIFICATION → VALIDATION**: After ambiguities reduced below threshold

### 2. Knowledge Extraction Pipeline

```
User Response → AI Extraction → Schema Validation → Entity Deduplication → Graph Update
```

**Extraction outputs are schema-validated:**
- Entity types: `task`, `role`, `trigger`, `decision`, `artifact`, `system`, `rule`
- Relation types: `depends_on`, `triggers`, `owned_by`, `produces`, `consumes`, `decides`
- Each item has a confidence score (0.0-1.0)

### 3. Risk Detection Rules

| Rule | What It Detects | Severity |
|------|-----------------|----------|
| Single Point of Failure | Role owns 3+ unique tasks | HIGH |
| Undocumented Decision | Decision without conditions | MEDIUM |
| Orphaned Task | Task with no owner or trigger | MEDIUM-HIGH |
| Brittle Chain | Dependency chain > 5 steps | MEDIUM |
| Circular Dependency | Deadlock-causing loops | CRITICAL |
| Bottleneck | Node with 4+ incoming edges | MEDIUM |

### 4. SOP Generation

1. **Topological Sort**: Order nodes from start to end
2. **Role Assignment**: Map tasks to responsible roles via `owned_by` edges
3. **Decision Branches**: Extract labeled edges for branching logic
4. **Confidence Markers**: Flag steps that are inferred vs confirmed
5. **Source Citations**: Link each step to original graph nodes

## 📊 Data Models

### Core Entities

```python
class Process:
    id: UUID
    name: str
    description: str
    department: str
    status: ProcessStatus  # draft, capturing, validating, published, archived
    current_graph_version: int

class Session:
    id: UUID
    process_id: UUID
    phase: SessionPhase  # onboarding, deep_dive, clarification, validation
    questions_asked: int
    entities_extracted: int
    knowledge_gaps: List[str]

class KnowledgeEntity:
    id: UUID
    entity_type: EntityType  # task, role, trigger, decision, artifact, system, rule
    name: str
    confidence: ConfidenceLevel  # high, medium, low, unverified
    confidence_score: float  # 0.0-1.0
    source_response_ids: List[UUID]  # Provenance tracking

class GraphEdge:
    source_node_id: UUID
    target_node_id: UUID
    relation_type: RelationType
    label: str  # e.g., "Yes", "No" for decisions
    conditions: List[str]
```

## 🔒 Design Principles

1. **AI outputs are schema-validated** - No raw hallucinated logic
2. **Deterministic where possible** - Rule-based checks before AI reasoning
3. **Explainability first** - Every risk has WHY, every SOP step has source
4. **Version control built-in** - Graph snapshots enable diffing and rollback
5. **Graceful degradation** - Works without AI key (mock responses)

## 🧪 Testing

```bash
# Run tests
PYTHONPATH=$(pwd) pytest tests/ -v

# Run with coverage
PYTHONPATH=$(pwd) pytest tests/ --cov=app --cov-report=html
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/              # FastAPI route handlers
│   │   ├── processes.py  # Process CRUD
│   │   ├── sessions.py   # Questioning sessions
│   │   ├── graphs.py     # Graph operations
│   │   └── generation.py # SOP & Risk endpoints
│   ├── core/             # Configuration
│   ├── models/           # Pydantic schemas
│   ├── services/         # Business logic
│   │   ├── conversation.py  # Questioning engine
│   │   ├── extraction.py    # Knowledge extraction
│   │   ├── generation.py    # SOP generation
│   │   └── risk.py          # Risk analysis
│   ├── graph/            # Graph engine (NetworkX)
│   ├── ai/               # Gemini integration
│   └── main.py           # FastAPI app factory
├── docs/
│   └── ALGORITHMS.py     # Pseudocode documentation
├── tests/
├── requirements.txt
└── README.md
```

## 🚀 Production Considerations

For production deployment:

1. **Database**: Replace in-memory storage with PostgreSQL
2. **Graph DB**: Consider Neo4j for complex graph queries
3. **Async Processing**: Use Celery for heavy AI operations
4. **Caching**: Redis for session state and extraction results
5. **Auth**: Add JWT authentication middleware
6. **Monitoring**: Integrate OpenTelemetry for tracing

## 📄 License

MIT
