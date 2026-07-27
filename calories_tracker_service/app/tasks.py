from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import Dish, FoodEntry, User
from app.serializers import serialize_food_entry
from app.services.stats import build_stats


def _upsert_user(db, user_id: str, email: str, role: str) -> User:
    role_code = (role or 'CUSTOMER').strip().upper() or 'CUSTOMER'
    user = db.get(User, user_id)
    if user:
        user.email = email
        user.role_code = role_code
        user.updated_at = datetime.now(timezone.utc)
        return user

    user = User(id=user_id, email=email, role_code=role_code)
    db.add(user)
    return user


@celery_app.task(name='nutrition.sync_user')
def sync_user_task(user_id: str, email: str, role: str = 'CUSTOMER'):
    db = SessionLocal()
    try:
        _upsert_user(db, user_id, email, role)
        db.commit()
        return {'status': 'ok', 'user_id': user_id}
    finally:
        db.close()


@celery_app.task(name='nutrition.save_food_entry')
def save_food_entry_task(user_id: str, entry_payload: dict):
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if not user:
            raise ValueError('User not found in nutrition database.')

        eaten_at = entry_payload.get('eaten_at')
        if isinstance(eaten_at, str):
            eaten_at = datetime.fromisoformat(eaten_at.replace('Z', '+00:00'))
        elif eaten_at is None:
            eaten_at = datetime.now(timezone.utc)

        dish = Dish(
            id=str(uuid4()),
            created_by_user_id=user_id,
            name=entry_payload['dish_name'],
            description=entry_payload['description'],
            image_url=entry_payload['image_url'],
            calories=entry_payload['calories'],
            proteins=entry_payload['proteins'],
            fats=entry_payload['fats'],
            carbohydrates=entry_payload['carbohydrates'],
        )
        entry = FoodEntry(
            id=entry_payload.get('id') or str(uuid4()),
            user_id=user_id,
            dish_id=dish.id,
            eaten_at=eaten_at,
        )
        db.add(dish)
        db.add(entry)
        db.commit()

        loaded = db.scalars(
            select(FoodEntry)
            .options(joinedload(FoodEntry.dish))
            .where(FoodEntry.id == entry.id)
        ).unique().one()

        return serialize_food_entry(loaded).model_dump(mode='json')
    finally:
        db.close()


@celery_app.task(name='nutrition.refresh_stats')
def refresh_stats_task(user_id: str, range_key: str, from_iso: str, to_iso: str):
    db = SessionLocal()
    try:
        from_dt = datetime.fromisoformat(from_iso.replace('Z', '+00:00'))
        to_dt = datetime.fromisoformat(to_iso.replace('Z', '+00:00'))
        stats = build_stats(db, user_id, range_key, from_dt, to_dt)
        return stats.model_dump()
    finally:
        db.close()


@celery_app.task(name='nutrition.process_queue_message')
def process_queue_message(message: dict):
    task_name = message.get('task')
    payload = message.get('payload') or {}

    if task_name == 'sync_user':
        return sync_user_task.delay(
            payload['id'],
            payload['email'],
            payload.get('role', 'CUSTOMER'),
        ).id

    if task_name == 'save_food_entry':
        return save_food_entry_task.delay(payload['user_id'], payload['entry']).id

    if task_name == 'refresh_stats':
        return refresh_stats_task.delay(
            payload['user_id'],
            payload['range'],
            payload['from'],
            payload['to'],
        ).id

    raise ValueError(f'Unknown task: {task_name}')
