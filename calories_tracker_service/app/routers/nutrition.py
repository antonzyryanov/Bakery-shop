from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Dish, FoodEntry, User
from app.schemas import FoodEntryCreate, FoodEntryResponse, UserSyncRequest
from app.serializers import serialize_food_entry, serialize_user
from app.services.stats import build_stats
from app.tasks import refresh_stats_task, sync_user_task

router = APIRouter(prefix='/api/v1', tags=['nutrition'])


def require_internal_key(x_internal_api_key: str = Header(default='')):
    from app.config import settings

    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail='Invalid internal API key.')


def parse_range(range_key: str, from_value: str | None, to_value: str | None):
    now = datetime.now(timezone.utc)
    if range_key == 'last_day':
        return now - timedelta(days=1), now
    if range_key == 'last_week':
        return now - timedelta(days=7), now
    if range_key == 'last_month':
        return now - timedelta(days=30), now
    if range_key == 'custom':
        if not from_value or not to_value:
            raise HTTPException(status_code=400, detail='Custom range requires from and to.')
        from_dt = datetime.fromisoformat(from_value.replace('Z', '+00:00'))
        to_dt = datetime.fromisoformat(to_value.replace('Z', '+00:00'))
        if to_dt < from_dt:
            raise HTTPException(status_code=400, detail='Invalid custom date range.')
        return from_dt, to_dt
    raise HTTPException(status_code=400, detail='Unsupported range.')


@router.post('/internal/users/sync', dependencies=[Depends(require_internal_key)])
def sync_user(payload: UserSyncRequest, db: Session = Depends(get_db)):
    role_code = (payload.role or 'CUSTOMER').strip().upper() or 'CUSTOMER'
    user = db.get(User, payload.id)
    if user:
        user.email = payload.email
        user.role_code = role_code
        user.updated_at = datetime.now(timezone.utc)
    else:
        user = User(id=payload.id, email=payload.email, role_code=role_code)
        db.add(user)
    db.commit()
    db.refresh(user)
    sync_user_task.delay(payload.id, payload.email, role_code)
    return {'user': serialize_user(user)}


@router.get('/entries', response_model=list[FoodEntryResponse])
def list_entries(
    user_id: str = Query(...),
    range_key: str = Query('last_month', alias='range'),
    from_value: str | None = Query(None, alias='from'),
    to_value: str | None = Query(None, alias='to'),
    db: Session = Depends(get_db),
    _: None = Depends(require_internal_key),
):
    from_dt, to_dt = parse_range(range_key, from_value, to_value)
    stmt = (
        select(FoodEntry)
        .options(joinedload(FoodEntry.dish))
        .where(
            and_(
                FoodEntry.user_id == user_id,
                FoodEntry.eaten_at >= from_dt,
                FoodEntry.eaten_at <= to_dt,
            )
        )
        .order_by(FoodEntry.eaten_at.desc())
    )
    entries = db.scalars(stmt).unique().all()
    return [serialize_food_entry(entry) for entry in entries]


@router.post('/entries', response_model=FoodEntryResponse)
def create_entry(
    user_id: str = Query(...),
    payload: FoodEntryCreate = ...,
    db: Session = Depends(get_db),
    _: None = Depends(require_internal_key),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found in nutrition database.')

    eaten_at = payload.eaten_at or datetime.now(timezone.utc)
    dish = Dish(
        created_by_user_id=user_id,
        name=payload.dish_name.strip(),
        description=payload.description.strip(),
        image_url=payload.image_url.strip(),
        calories=payload.calories,
        proteins=payload.proteins,
        fats=payload.fats,
        carbohydrates=payload.carbohydrates,
    )
    entry = FoodEntry(
        user_id=user_id,
        dish=dish,
        eaten_at=eaten_at,
    )
    db.add(dish)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    entry = db.scalars(
        select(FoodEntry).options(joinedload(FoodEntry.dish)).where(FoodEntry.id == entry.id)
    ).unique().one()

    from_dt, to_dt = parse_range('last_month', None, None)
    refresh_stats_task.delay(user_id, 'last_month', from_dt.isoformat(), to_dt.isoformat())

    return serialize_food_entry(entry)


@router.get('/stats')
def get_stats(
    user_id: str = Query(...),
    range_key: str = Query('last_month', alias='range'),
    from_value: str | None = Query(None, alias='from'),
    to_value: str | None = Query(None, alias='to'),
    db: Session = Depends(get_db),
    _: None = Depends(require_internal_key),
):
    from_dt, to_dt = parse_range(range_key, from_value, to_value)
    return build_stats(db, user_id, range_key, from_dt, to_dt)
