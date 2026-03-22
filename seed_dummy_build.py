import requests
import json
from datetime import datetime

# Read the dummy log file content
log_file_path = "logs/jenkins_log.txt"
with open(log_file_path, "r", encoding="utf-8") as f:
    log_content = f.read()

# Prepare the payload matching the teammate's LogIngestRequest schema
payload = {
    "build_id": "build-7",
    "project": "TRACE",
    "branch": "feature/log-parser",
    "commit_id": "abc123def456",
    "status": "SUCCESS",
    "timestamp": datetime.now().isoformat(),
    "log": log_content
}

# The endpoint created by the teammates
url = "http://localhost:8000/api/v1/ingest-log"

print(f"Sending payload to {url}...")
try:
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        print("Success! The log has been queued to Redis.")
        print("The backend worker will now automatically save it to PostgreSQL and MinIO.")
    else:
        print(f"Failed with status code: {response.status_code}")
        print(response.text)
except requests.exceptions.ConnectionError:
    print("Connection Error: Is the backend running via 'docker-compose up -d'?")
