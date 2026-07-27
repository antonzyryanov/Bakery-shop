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

If you already have the old (pre-3NF) schema:

```bash
psql -h localhost -p 5434 -U postgres -d bakery_nutrition -f migrate_to_3nf.sql
```

## Schema (3NF)

- `roles` — role lookup (`CUSTOMER`, `ADMIN`)
- `users` — identity + `role_code` FK (no embedded role descriptors)
- `dishes` — dish name, image, macros, description
- `food_entries` — consumption facts only (`user_id`, `dish_id`, `eaten_at`)

API responses stay flat (dish fields are joined/serialized for the Node/React clients).

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
