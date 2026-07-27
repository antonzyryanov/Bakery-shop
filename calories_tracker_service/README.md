# Calories Tracker Service (FastAPI + PostgreSQL + Celery)

Python microservice for customer nutrition tracking.

## Local setup

```bash
cd calories_tracker_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Create PostgreSQL database:

```bash
psql -h localhost -p 5434 -U postgres -f init.sql
```

Run API:

```bash
python run_api.py
```

Run Celery worker (separate terminal):

```bash
celery -A app.celery_app.celery_app worker --loglevel=info -Q nutrition
```

## API

- `GET /health`
- `POST /api/v1/internal/users/sync` (internal key)
- `GET /api/v1/entries?user_id=...&range=last_month`
- `POST /api/v1/entries?user_id=...`
- `GET /api/v1/stats?user_id=...&range=last_week`

Node.js Express exposes customer-facing routes at `/api/nutrition/*`.
