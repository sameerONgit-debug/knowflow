# KnowFlow Demo Instructions

## 1. Start the Backend
Open a terminal and run:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```
*Note: Ensure virtual environment is active if applicable.*

## 2. Start the Frontend
Open a new terminal and run:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 3. Demo Flow (Manual)
1. **Landing Page**: Click "Get Started".
2. **Auth**: Sign up with a new account (e.g., `demo`/`demo123`).
3. **Dashboard**: Click "New Process" (top left +).
   - Name: "Onboarding Flow"
   - Dept: "HR"
4. **Graph**: See the empty graph with "System Active" indicator.
5. **Session**: Click "Start Capture" (Sidebar).
   - "Start Session".
   - The AI will greet you (Mock mode).
   - Answer the question (e.g., "The first step is sending a welcome email.").
   - Click "Submit".
   - See extraction success message.
6. **Graph Update**: Go back to "Dashboard" (Graph).
   - See the new node "Send welcome email" appear in the "Tasks" swimlane.
   - Note the "Confidence" strip on the node.
7. **Security Check**:
   - Logout.
   - Register a new user `hacker`/`123`.
   - See an empty process list (Data isolation works).

## 4. Automated Verification
To prove the system works without clicking:
```bash
cd backend
python3 verify_complete.py
```
This script will:
- Register users
- Create processes
- Verify data isolation (Security)
- Simulate an AI session
- Verify graph updates
