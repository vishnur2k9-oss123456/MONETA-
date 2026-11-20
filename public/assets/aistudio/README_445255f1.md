# SIH26184 – Intelligent Cybercrime Predictive Analytics Backend

## Overview

This repository implements a modular, scalable, and intelligent backend for the **Smart India Hackathon** problem *"Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash Withdrawal Locations"*.  The system combines:

1. **Temporal Graph Intelligence** – time‑aware transaction graph analysis.
2. **Geospatial Predictive Intelligence** – predicts and ranks ATM/branch locations.
3. **AI Model Feedback Loop** – continuous evaluation and versioned model management.
4. **Cross‑Complaint Intelligence** – correlation across multiple complaints.
5. **Intelligent Risk Priority Engine** – AI‑assisted investigation prioritisation.

All features are exposed via a FastAPI backend with JWT authentication, WebSocket notifications, and full OpenAPI (Swagger) documentation.

---

## Project Structure

```
si_h26184_backend/
├─ app/
│  ├─ __init__.py
│  ├─ main.py                # FastAPI entry point
│  ├─ database.py            # Async DB engine & session
│  ├─ security.py            # JWT utilities & role checks
│  ├─ models/                # SQLAlchemy ORM models
│  │   ├─ __init__.py
│  │   ├─ user.py
│  │   ├─ complaint.py
│  │   ├─ transaction.py
│  │   ├─ account.py
│  │   ├─ bank.py
│  │   ├─ atm_location.py
│  │   ├─ prediction.py
│  │   ├─ model_version.py
│  │   ├─ feedback.py
│  │   ├─ risk_score.py
│  │   ├─ alert.py
│  │   └─ audit_log.py
│  ├─ schemas/               # Pydantic request/response models
│  │   ├─ __init__.py
│  │   ├─ auth.py
│  │   ├─ complaint.py
│  │   ├─ transaction.py
│  │   ├─ prediction.py
│  │   └─ alert.py
│  ├─ api/                   # FastAPI routers
│  │   ├─ __init__.py
│  │   ├─ auth.py
│  │   ├─ complaints.py
│  │   ├─ transactions.py
│  │   ├─ predictions.py
│  │   ├─ alerts.py
│  │   └─ health.py
│  ├─ services/              # Core business logic
│  │   ├─ __init__.py
│  │   ├─ graph_service.py
│  │   ├─ geo_service.py
│  │   ├─ ml_service.py
│  │   ├─ risk_service.py
│  │   └─ feedback_service.py
│  └─ utils/
│      └─ logger.py
├─ data/                      # Synthetic dataset (CSV)
│   ├─ users.csv
│   ├─ complaints.csv
│   └─ transactions.csv
├─ tests/                     # Unit & integration tests
│   ├─ conftest.py
│   ├─ test_auth.py
│   ├─ test_complaint.py
│   └─ test_prediction.py
├─ scripts/                   # Helper scripts (data generation, model training)
│   └─ generate_synthetic_data.py
├─ requirements.txt
└─ .gitignore
```

---

## Setup Instructions

1. **Prerequisites**
   - Python 3.12 or newer
   - PostgreSQL server (optional – default fallback is SQLite for quick start)
   - Git (to clone the repo if you copy it elsewhere)

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure the database**
   - Create a PostgreSQL database (e.g., `sih26184`).
   - Set the connection URL in an `.env` file:
     ```dotenv
     DATABASE_URL=postgresql+asyncpg://user:password@localhost/sih26184
     SECRET_KEY=your‑very‑secure‑random‑string
     ACCESS_TOKEN_EXPIRE_MINUTES=60
     ```
   - If `.env` is not present, the app will fall back to an in‑memory SQLite DB.

5. **Run database initialisation**
   ```bash
   python -c "import asyncio; from app.database import init_db; asyncio.run(init_db())"
   ```
   This creates all tables.

6. **Generate synthetic data (optional but recommended for testing)**
   ```bash
   python scripts/generate_synthetic_data.py
   ```
   The script populates the DB with a few hundred users, complaints and transaction records.

7. **Start the FastAPI server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Open <http://localhost:8000/docs> for the Swagger UI.

8. **Running tests**
   ```bash
   pytest -q
   ```

---

## Core Modules Overview

| Module | Purpose |
|---|---|
| **graph_service** | Builds a time‑aware `networkx` DiGraph from transactions, computes risk indicators, and snapshots. |
| **geo_service** | Stores ATM/branch locations, performs clustering, generates GeoJSON heat‑maps, and ranks predictions. |
| **ml_service** | Simple Scikit‑learn pipeline (RandomForest) that predicts likely ATM IDs; versioned with `model_versions`. |
| **risk_service** | Combines graph‑risk, geospatial confidence, complaint age, amount, and investigation status into a priority score. |
| **feedback_service** | Persists prediction outcomes, evaluates precision/recall per model version, and triggers optional retraining. |
| **security** | JWT creation/validation, role based access (`admin`, `officer`). |
| **alerts** | WebSocket broadcaster for real‑time notifications (new high‑priority case, prediction ready, etc.). |

All heavy‑weight operations (graph building, model inference) are executed asynchronously using `run_in_threadpool` to keep the API responsive.

---

## API Summary (Swagger)

| Prefix | Description |
|---|---|
| **/auth/** | `login`, `refresh_token` – returns JWTs. |
| **/complaints/** | CRUD for complaints, status updates, investigation history. |
| **/transactions/** | Bulk ingest of transaction records, validation, graph trigger. |
| **/predictions/** | Trigger geospatial prediction, retrieve ranked locations, explanation. |
| **/risk/** | Compute and fetch urgency scores and ordered investigation queue. |
| **/feedback/** | Submit verified outcomes, view model performance metrics. |
| **/alerts/ws** | WebSocket endpoint for real‑time officer alerts. |

---

## License

MIT – feel free to adapt, extend, and share.

---

*Created by an automated AI‑assisted backend generator.  Further customisation (real data pipelines, production‑grade security, CI/CD, monitoring) is expected for a production deployment.*
