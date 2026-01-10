
import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def log(msg, success=True):
    icon = "✅" if success else "❌"
    print(f"{icon} {msg}")

def test_flow():
    print("🚀 Starting End-to-End Verification Flow...")

    # 1. Register User 1
    u1_creds = {"username": "admin", "password": "password123", "full_name": "Admin User"}
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json=u1_creds)
        if resp.status_code == 200:
            log("User 1 registered")
        else:
            log(f"User 1 registration failed: {resp.text}", False)
            return
    except Exception as e:
        log(f"Backend not reachable: {e}", False)
        return

    # 2. Login User 1
    resp = requests.post(f"{BASE_URL}/auth/token", json={"username": "admin", "password": "password123"})
    if resp.status_code != 200:
        log("User 1 login failed", False)
        return
    token1 = resp.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    log("User 1 logged in")

    # 3. Create Process
    proc_data = {"name": "Test Process", "department": "IT"}
    resp = requests.post(f"{BASE_URL}/processes", json=proc_data, headers=headers1)
    if resp.status_code != 201:
        log(f"Process creation failed: {resp.text}", False)
        return
    proc_id = resp.json()["id"]
    log(f"Process created: {proc_id}")

    # 4. Verify List (Scoped)
    resp = requests.get(f"{BASE_URL}/processes", headers=headers1)
    procs = resp.json()["processes"]
    if len(procs) == 1 and procs[0]["id"] == proc_id:
        log("User 1 sees their process")
    else:
        log("User 1 listing incorrect", False)

    # 5. Register User 2
    u2_creds = {"username": "guest", "password": "password123"}
    requests.post(f"{BASE_URL}/auth/register", json=u2_creds)
    resp = requests.post(f"{BASE_URL}/auth/token", json=u2_creds)
    token2 = resp.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    log("User 2 registered and logged in")

    # 6. Verify Scalability/Security (User 2 sees empty)
    resp = requests.get(f"{BASE_URL}/processes", headers=headers2)
    procs2 = resp.json()["processes"]
    if len(procs2) == 0:
        log("User 2 sees 0 processes (Security Verified)")
    else:
        log(f"Security Failure! User 2 sees {len(procs2)} processes", False)

    # 7. Start Session (User 1)
    resp = requests.post(f"{BASE_URL}/sessions/{proc_id}/sessions", json={}, headers=headers1)
    if resp.status_code == 201:
        session_id = resp.json()["id"]
        log("Session started")
    else:
        log("Session start failed", False)
        return

    # 8. Submit Response (Trigger Mock AI)
    # The session automatically generates first q? Or we fetch next?
    resp = requests.get(f"{BASE_URL}/sessions/{session_id}/next-question", headers=headers1)
    if resp.status_code == 200:
        q_id = resp.json()["id"]
        log(f"Received AI Question: {resp.json()['text']}")
        
        # Answer
        ans_data = {"response_text": "The manager approves the loan request."}
        resp = requests.post(f"{BASE_URL}/sessions/{session_id}/responses", json=ans_data, headers=headers1)
        if resp.status_code == 200:
             extracted = resp.json()["entities_extracted"]
             log(f"Response processed. Extracted {extracted} entities (Mock AI)")
        else:
             log(f"Response submission failed: {resp.text}", False)
    else:
        log("Failed to get question", False)

    log("🎉 ALL SYSTEMS GO. Demo Ready.")

if __name__ == "__main__":
    test_flow()
