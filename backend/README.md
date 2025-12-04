# Backend API

FastAPI backend for document processing requests.

## Installation

### With Poetry (Recommended)

1. Install Poetry if you haven't already:
```bash
pip install poetry
```

2. Install dependencies:
```bash
poetry install
```

### With pip

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### With Poetry

```bash
poetry run start
```

Or activate the virtual environment and run directly:
```bash
poetry shell
python main.py
```

### With pip

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### 1. Request Top Five Countries
**POST** `/api/request-countries`

Request body (all fields optional):
```json
{
    "workstream": "Drug Product",
    "material_id": "MAT001",
    "document_type": "DPFD",
    "version": "v1.0"
}
```

Response:
```json
{
    "token_id": "token_abc123",
    "batch_id": "batch_xyz789",
    "status": "pending",
    "message": "Job created successfully. Use token_id to check status."
}
```

### 2. Check Job Status
**GET** `/api/job-status/{token_id}`

Response:
```json
{
    "token_id": "token_abc123",
    "batch_id": "batch_xyz789",
    "workstream": "Drug Product",
    "material_id": "MAT001",
    "document_type": "DPFD",
    "version": "v1.0",
    "status": "completed",
    "created_at": "2024-12-04T10:30:00",
    "completed_at": "2024-12-04T10:30:05",
    "result": [
        "United States",
        "China",
        "Germany",
        "United Kingdom",
        "France"
    ]
}
```

### 3. Get All Jobs
**GET** `/api/jobs`

Returns all jobs in the system.

### 4. Delete Job
**DELETE** `/api/jobs/{token_id}`

Deletes a job by token_id.

## Testing with curl

Request countries:
```bash
curl -X POST "http://localhost:8000/api/request-countries" \
  -H "Content-Type: application/json" \
  -d '{"workstream": "Drug Product", "material_id": "MAT001"}'
```

Check status:
```bash
curl "http://localhost:8000/api/job-status/token_abc123"
```
