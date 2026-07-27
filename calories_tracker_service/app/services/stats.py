from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select

from app.models import FoodEntry
from app.schemas import NutritionStatsResponse, StatsBucket


def _bucket_label(dt: datetime, range_key: str) -> str:
    if range_key == 'last_day':
        return dt.strftime('%H:00')
    return dt.strftime('%Y-%m-%d')


def build_stats(db, user_id: str, range_key: str, from_dt: datetime, to_dt: datetime) -> NutritionStatsResponse:
    stmt = (
        select(FoodEntry)
        .where(
            and_(
                FoodEntry.user_id == user_id,
                FoodEntry.eaten_at >= from_dt,
                FoodEntry.eaten_at <= to_dt,
            )
        )
        .order_by(FoodEntry.eaten_at.asc())
    )
    entries = db.scalars(stmt).all()

    buckets_map: dict[str, dict] = defaultdict(
        lambda: {
            'calories': 0.0,
            'proteins': 0.0,
            'fats': 0.0,
            'carbohydrates': 0.0,
            'entries_count': 0,
        }
    )

    totals = {
        'calories': 0.0,
        'proteins': 0.0,
        'fats': 0.0,
        'carbohydrates': 0.0,
        'entries_count': 0,
    }

    for entry in entries:
        label = _bucket_label(entry.eaten_at, range_key)
        bucket = buckets_map[label]
        for key in ('calories', 'proteins', 'fats', 'carbohydrates'):
            value = float(getattr(entry, key))
            bucket[key] += value
            totals[key] += value
        bucket['entries_count'] += 1
        totals['entries_count'] += 1

    if range_key == 'last_day' and not buckets_map:
        now = datetime.now(timezone.utc)
        for hour in range(24):
            label = (now - timedelta(hours=23 - hour)).strftime('%H:00')
            buckets_map.setdefault(label, {
                'calories': 0.0,
                'proteins': 0.0,
                'fats': 0.0,
                'carbohydrates': 0.0,
                'entries_count': 0,
            })

    buckets = [
        StatsBucket(label=label, **values)
        for label, values in sorted(buckets_map.items(), key=lambda item: item[0])
    ]

    return NutritionStatsResponse(
        range=range_key,
        from_date=from_dt,
        to_date=to_dt,
        totals=StatsBucket(label='total', **totals),
        buckets=buckets,
    )
