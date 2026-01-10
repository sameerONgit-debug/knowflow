# ⚡ KnowFlow: Turn Conversations into Living Process Intelligence

**"The missing link between team dialogue and actionable documentation."**

KnowFlow is an AI-powered process intelligence platform designed to capture team decisions, workflows, and institutional knowledge from everyday conversations. It automatically constructs a semantic knowledge graph, identifies operational risks, and generates Standard Operating Procedures (SOPs) in real-time.

---

## 🚀 Quick Start

### 🐳 The One-Command Deploy (Recommended)
```bash
# Clone the repository
git clone https://github.com/sameerONgit-debug/knowflow.git
cd knowflow

# Set your API Key
echo "GEMINI_API_KEY=your_key_here" > backend/.env

# Launch with Docker
docker compose up --build
```
*Access the app at [http://localhost](http://localhost)*

### 🛠️ Manual Development Setup

**Backend (FastAPI)**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

**Frontend (React + Vite)**
```bash
# Root directory
npm install
npm run dev
```

---

## ✨ Core Features

### 🧠 AI Knowledge Extraction
Real-time entity and relationship extraction from meeting transcripts or chat logs. Our proprietary "Extraction Pipeline" identifies:
- **Tasks & Actions**: Who is doing what.
- **Decision Logic**: Why a choice was made and the conditions involved.
- **Stakeholders**: Mapping roles to responsibilities.

### 🕸️ Living Process Graph
Automated visualization of complex workflows. 
- **Swimlane Board**: Auto-categorized view of inputs, roles, tasks, and decisions.
- **Version Control**: Snapshot current state and compare changes over time (Graph Diff).
- **Topology Intelligence**: Identifying root entry points and leaf exit points.

### 🛡️ Risk & Compliance Guardrails
Automated analysis to find:
- **Single Points of Failure**: Critical roles with too many unique dependencies.
- **Deadlocks**: Circular logic that stalls workflows.
- **Orphaned Tasks**: Actions without owners or triggers.

### 📄 Instant SOP Generation
One-click conversion from knowledge graph to professional, markdown-exportable Standard Operating Procedures.

---

## 🛠️ Technical Stack

- **Frontend**: React 18, TypeScript, Framer Motion (Animations), Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python), Pydantic (Validation), NetworkX (Graph Mathematics).
- **AI**: Google Gemini Pro (Instruction Tuning & Extraction).
- **Infrastructure**: Docker, Nginx, GitHub Actions (CI/CD).

---

## 🏗️ System Architecture

KnowFlow operates on a **Backend-as-the-Truth** model:
1. **Extraction**: Raw text is parsed by the AI Pipeline.
2. **Merging**: New entities are merged into a persistent Graph Store.
3. **Synthesis**: The Graph Store provides the source material for the SOP Generator and Risk Analyzer.
4. **Rendering**: The Frontend renders a deterministic visualization based on Graph Store metadata.

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 👥 Meet the Team
[Add Your Name/Team Info Here]

---

