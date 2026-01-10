# 👔 KnowFlow: Judges' Demo Guide

Welcome to the KnowFlow demonstration. This guide is designed to showcase the platform's ability to solve the "Institutional Memory Leak" problem.

## 🏁 The "Wow" Flow (3 Minutes)

### 1. The Landing (0:00 - 0:30)
*View the premium, high-fidelity entry point. This illustrates the "Calm Expert" aesthetic.*
- **Action**: Click "Get Started".
- **Action**: Create a demo account (e.g., `user1` / `pass123`).

### 2. The Capture (0:30 - 1:30)
*Demonstrate real-time intelligence extraction.*
- **Action**: Click **Start Capture** in the sidebar.
- **Action**: Name your process (e.g. "Customer Refund Flow").
- **Action**: Talk to the AI. Say: *"First, the customer submits a support ticket. Then, the agent checks if the order is under 30 days old."*
- **Outcome**: Witness the AI extract a **Task** (Submit ticket) and a **Decision** (Check age).

### 3. The Living Graph (1:30 - 2:00)
*Show cause-and-effect visualization.*
- **Action**: Go to the **Dashboard** (Graph View).
- **Insight**: Point out the **Swimlanes**. Notice how "Customer" is in the Roles lane, "Submit Ticket" is in Tasks, and "Age Check" is in Decisions.
- **Verification**: Note the **Confidence Strip** on each card.

### 4. The Risk Engine (2:00 - 2:30)
*Show how we prevent operational failures.*
- **Action**: Navigate to **Insights** (Risks).
- **Outcome**: The system identifies that the "Agent" is a bottleneck or that the "Refund" step is orphaned if the logic isn't finished.

### 5. Standard Operating Procedure (2:30 - 3:00)
*Turn knowledge into assets.*
- **Action**: Go to **Flows** (SOP).
- **Action**: Generate SOP.
- **Outcome**: A professional, structured document ready for a new hire to follow.

---

## 🏗️ Technical Highlights for Judges
- **Multi-Tenant Isolation**: All processes are strictly scoped to the authenticated user.
- **Deterministic state**: The graph is mathematically verified on the backend, not just a drawing on the frontend.
- **Resilient AI**: System operates flawlessly in Mock Mode if API keys are absent, ensuring a stable demo environment.

---

## 🛠️ Launching the Environment
**One-liner**: `docker compose up --build`
**Verification Script**: `python3 backend/verify_complete.py`
