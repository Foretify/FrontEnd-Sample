from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
import json
import os
from datetime import datetime

app = FastAPI(title="Document Processing API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to store job data
JOBS_FILE = os.path.join(os.path.dirname(__file__), "..", "results", "requests", "request-tokens.json")

# Request models
class JobRequest(BaseModel):
    workstream: Optional[str] = "Drug Product"
    material_id: Optional[str] = None
    document_type: Optional[str] = None
    version: Optional[str] = "v1.0"

class JobResponse(BaseModel):
    token_id: str
    batch_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    token_id: str
    batch_id: str
    workstream: str
    material_id: Optional[str] = None
    document_type: Optional[str] = None
    version: str
    status: str
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[List[str]] = None

# Helper functions
def load_jobs():
    """Load jobs from JSON file"""
    if not os.path.exists(JOBS_FILE):
        os.makedirs(os.path.dirname(JOBS_FILE), exist_ok=True)
        with open(JOBS_FILE, 'w') as f:
            json.dump({"requests": []}, f)
        return {"requests": []}
    
    with open(JOBS_FILE, 'r') as f:
        return json.load(f)

def save_jobs(data):
    """Save jobs to JSON file"""
    os.makedirs(os.path.dirname(JOBS_FILE), exist_ok=True)
    with open(JOBS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def get_top_five_countries():
    """Simulate getting top five countries - this would be your actual logic"""
    return [
        "United States",
        "China",
        "Germany",
        "United Kingdom",
        "France"
    ]

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "Document Processing API", "version": "1.0"}

@app.post("/api/request-countries", response_model=JobResponse)
def request_top_countries(job_request: JobRequest):
    """
    Request top five countries - creates a job and returns token_id
    """
    # Generate unique IDs
    token_id = f"token_{uuid.uuid4().hex[:12]}"
    batch_id = f"batch_{uuid.uuid4().hex[:8]}"
    
    # Load existing jobs
    jobs_data = load_jobs()
    
    # Create new job entry
    new_job = {
        "token_id": token_id,
        "batch_id": batch_id,
        "workstream": job_request.workstream,
        "material_id": job_request.material_id,
        "document_type": job_request.document_type,
        "version": job_request.version,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "completed_at": None,
        "result": None
    }
    
    # Add to requests
    jobs_data["requests"].append(new_job)
    
    # Save to file
    save_jobs(jobs_data)
    
    # Simulate processing - in real scenario, this would be async/background task
    # For now, we'll complete it immediately
    process_job(token_id)
    
    return JobResponse(
        token_id=token_id,
        batch_id=batch_id,
        status="pending",
        message="Job created successfully. Use token_id to check status."
    )

def process_job(token_id: str):
    """
    Process the job - this simulates the actual work
    In production, this would be a background task
    """
    jobs_data = load_jobs()
    
    # Find the job
    for job in jobs_data["requests"]:
        if job["token_id"] == token_id:
            # Get the top five countries
            countries = get_top_five_countries()
            
            # Update job status
            job["status"] = "completed"
            job["completed_at"] = datetime.now().isoformat()
            job["result"] = countries
            
            # Save updated data
            save_jobs(jobs_data)
            break

@app.get("/api/job-status/{token_id}", response_model=JobStatusResponse)
def get_job_status(token_id: str):
    """
    Check the status of a job using token_id
    Returns job details and result if completed
    """
    jobs_data = load_jobs()
    
    # Find the job with matching token_id
    for job in jobs_data["requests"]:
        if job["token_id"] == token_id:
            return JobStatusResponse(**job)
    
    # Job not found
    raise HTTPException(status_code=404, detail=f"Job with token_id '{token_id}' not found")

@app.get("/api/jobs")
def get_all_jobs():
    """
    Get all jobs (for debugging/admin purposes)
    """
    jobs_data = load_jobs()
    return jobs_data

@app.delete("/api/jobs/{token_id}")
def delete_job(token_id: str):
    """
    Delete a job by token_id
    """
    jobs_data = load_jobs()
    
    # Filter out the job to delete
    original_length = len(jobs_data["requests"])
    jobs_data["requests"] = [job for job in jobs_data["requests"] if job["token_id"] != token_id]
    
    if len(jobs_data["requests"]) == original_length:
        raise HTTPException(status_code=404, detail=f"Job with token_id '{token_id}' not found")
    
    save_jobs(jobs_data)
    return {"message": f"Job {token_id} deleted successfully"}

@app.post("/api/update-statuses")
def update_all_statuses():
    """
    Update statuses for all pending requests by checking their job status
    Returns summary of updates made
    """
    # Load jobs from questions folder
    questions_file = os.path.join(os.path.dirname(__file__), "..", "questions", "request-tokens.json")
    
    try:
        if os.path.exists(questions_file):
            with open(questions_file, 'r') as f:
                questions_data = json.load(f)
        else:
            return {"message": "No questions file found", "updated": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading questions file: {str(e)}")
    
    # Load current job statuses from results folder
    jobs_data = load_jobs()
    
    updated_count = 0
    already_completed = 0
    
    # Update each request in questions file
    for request in questions_data.get("requests", []):
        token_id = request.get("token_id")
        
        # Skip if already SUCCESS
        if request.get("status") == "SUCCESS":
            already_completed += 1
            continue
        
        # Find matching job in results
        for job in jobs_data.get("requests", []):
            if job.get("token_id") == token_id:
                if job.get("status") == "completed":
                    request["status"] = "SUCCESS"
                    if job.get("completed_at"):
                        request["completed_at"] = job["completed_at"]
                    if job.get("result"):
                        request["result"] = job["result"]
                    updated_count += 1
                break
    
    # Save updated questions file
    try:
        with open(questions_file, 'w') as f:
            json.dump(questions_data, f, indent=4)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving questions file: {str(e)}")
    
    return {
        "message": "Status update complete",
        "updated": updated_count,
        "already_completed": already_completed,
        "total": len(questions_data.get("requests", []))
    }
    
    if len(jobs_data["requests"]) == original_length:
        raise HTTPException(status_code=404, detail=f"Job with token_id '{token_id}' not found")
    
    save_jobs(jobs_data)
    return {"message": f"Job {token_id} deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
