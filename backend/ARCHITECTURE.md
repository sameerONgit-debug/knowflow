# KnowFlow Backend Architecture

## High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                    (React Frontend / API Consumers)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Process    │ │  Session    │ │   Graph     │ │   Generation & Risk     ││
│  │  Endpoints  │ │  Endpoints  │ │  Endpoints  │ │   Endpoints             ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
┌───────────────────────┐ ┌──────────────────┐ ┌─────────────────────────────┐
│  CONVERSATION ENGINE  │ │ EXTRACTION       │ │  GENERATION SERVICES        │
│  ─────────────────────│ │ PIPELINE         │ │  ───────────────────────────│
│  • Session State Mgmt │ │ ────────────────│ │  • SOP Generator            │
│  • Question Selection │ │ • Entity Extract │ │  • Risk Analyzer            │
│  • Confidence Tracker │ │ • Relation Map   │ │  • Dependency Mapper        │
│  • Adaptive Flow      │ │ • Schema Valid   │ │  • Change Propagator        │
└───────────────────────┘ └──────────────────┘ └─────────────────────────────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROCESS GRAPH ENGINE                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────────┐│
│  │  Graph Store    │ │  Version Control│ │  Query & Traversal Engine      ││
│  │  (Neo4j/SQLite) │ │  (Diff Engine)  │ │  (Path Finding, Clustering)    ││
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI ORCHESTRATION LAYER                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Gemini API Adapter  │  Schema Validator  │  Confidence Scorer          ││
│  │  Prompt Templates    │  Output Parser     │  Hallucination Guard        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PERSISTENCE LAYER                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────────┐│
│  │  SQLite/Postgres│ │  Graph Database │ │  Blob Storage (Artifacts)      ││
│  │  (Metadata)     │ │  (Relationships)│ │  (SOPs, Exports)               ││
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### 1. API Layer (`/api`)
| Component | Responsibility |
|-----------|----------------|
| `processes.py` | CRUD for Process entities, lifecycle management |
| `sessions.py` | Stateful questioning sessions, response ingestion |
| `graphs.py` | Graph retrieval, versioning, diff endpoints |
| `generation.py` | SOP creation, Risk analysis triggers |

### 2. Conversation Engine (`/services/conversation.py`)
- **State Machine**: Tracks session phase (ONBOARDING → DEEP_DIVE → VALIDATION → COMPLETE)
- **Knowledge Gap Detector**: Identifies what entities/relationships are missing
- **Question Selector**: Chooses next question based on priority and confidence
- **Adaptive Branching**: Follows up on ambiguous answers

### 3. Extraction Pipeline (`/services/extraction.py`)
- **Entity Extractor**: Pulls Tasks, Roles, Triggers, Decisions from text
- **Relationship Mapper**: Infers edges (depends_on, triggers, owned_by)
- **Schema Validator**: Ensures AI output conforms to `KnowledgeEntity` schema
- **Confidence Scorer**: Assigns 0.0-1.0 score based on explicitness

### 4. Process Graph Engine (`/graph`)
- **Graph Store**: Abstraction over Neo4j or in-memory graph
- **Version Controller**: Creates immutable snapshots on each mutation
- **Diff Engine**: Computes changes between versions
- **Traversal API**: Shortest path, dependency chains, subgraph extraction

### 5. Generation Services (`/services/generation.py`)
- **SOP Generator**: Transforms graph into structured document
- **Decision Logic Extractor**: Identifies branching conditions
- **Citation Engine**: Links each SOP line to source node/response

### 6. Risk Analyzer (`/services/risk.py`)
- **Single Point of Failure Detector**: Finds roles with unique critical tasks
- **Orphan Task Finder**: Tasks with no owner or trigger
- **Brittle Chain Analyzer**: Long dependency chains with low confidence
- **Undocumented Decision Detector**: Decision nodes without conditions

---

## API Endpoint Specification

### Process Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/processes` | Create new process |
| `GET` | `/api/v1/processes/{id}` | Get process details |
| `GET` | `/api/v1/processes` | List all processes |
| `DELETE` | `/api/v1/processes/{id}` | Archive process |

### Session & Questioning
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/processes/{id}/sessions` | Start questioning session |
| `GET` | `/api/v1/sessions/{id}` | Get session state |
| `GET` | `/api/v1/sessions/{id}/next-question` | Get adaptive next question |
| `POST` | `/api/v1/sessions/{id}/responses` | Submit user response |
| `GET` | `/api/v1/sessions/{id}/knowledge-state` | View extracted entities |

### Graph Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/processes/{id}/graph` | Get current graph |
| `GET` | `/api/v1/processes/{id}/graph/versions` | List graph versions |
| `GET` | `/api/v1/processes/{id}/graph/diff` | Compare two versions |

### Generation & Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/processes/{id}/sop/generate` | Generate SOP |
| `GET` | `/api/v1/processes/{id}/sop/latest` | Get latest SOP |
| `POST` | `/api/v1/processes/{id}/risks/analyze` | Run risk analysis |
| `GET` | `/api/v1/processes/{id}/risks` | Get risk findings |

---

## Design Tradeoffs

| Decision | Rationale | Alternative Considered |
|----------|-----------|------------------------|
| **SQLite for MVP** | Zero-config, portable, sufficient for hackathon scale | PostgreSQL (production) |
| **In-memory graph with persistence** | Fast iteration, avoid Neo4j setup complexity | Full Neo4j (scalability) |
| **Synchronous extraction** | Simpler debugging, acceptable latency for MVP | Celery queue (production) |
| **Gemini over GPT-4** | Cost-effective, strong structured output | OpenAI (fallback supported) |
| **Version snapshots over event sourcing** | Simpler implementation, clear diffing | CQRS (complex processes) |

---

## Extensibility Points

1. **New Entity Types**: Add to `EntityType` enum, extend extraction prompts
2. **Custom Risk Rules**: Implement `RiskRule` interface, register in analyzer
3. **Alternative AI Providers**: Implement `AIProvider` protocol
4. **Graph Backends**: Swap `GraphStore` implementation (Neo4j, Neptune)
5. **Export Formats**: Add serializers for PDF, BPMN, Visio
