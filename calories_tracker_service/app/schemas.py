from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class UserSyncRequest(BaseModel):
    id: str
    email: str
    role: str = 'CUSTOMER'


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime
    updated_at: datetime

    model_config = {'from_attributes': True}


class FoodEntryCreate(BaseModel):
    dish_name: str = Field(min_length=1, max_length=255)
    image_url: str = Field(min_length=1, max_length=500)
    calories: float = Field(ge=0)
    proteins: float = Field(ge=0)
    fats: float = Field(ge=0)
    carbohydrates: float = Field(ge=0)
    description: str = Field(min_length=1, max_length=4000)
    eaten_at: datetime | None = None


class FoodEntryResponse(BaseModel):
    id: str
    user_id: str
    dish_name: str
    image_url: str
    calories: float
    proteins: float
    fats: float
    carbohydrates: float
    description: str
    eaten_at: datetime
    created_at: datetime

    model_config = {'from_attributes': True}


class StatsBucket(BaseModel):
    label: str
    calories: float
    proteins: float
    fats: float
    carbohydrates: float
    entries_count: int


class NutritionStatsResponse(BaseModel):
    range: str
    from_date: datetime
    to_date: datetime
    totals: StatsBucket
    buckets: list[StatsBucket]


class QueueTaskRequest(BaseModel):
    task: Literal['sync_user', 'save_food_entry', 'refresh_stats']
    payload: dict
