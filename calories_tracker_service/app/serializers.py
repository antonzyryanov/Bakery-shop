from app.models import FoodEntry, User
from app.schemas import FoodEntryResponse, UserResponse


def serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def serialize_food_entry(entry: FoodEntry) -> FoodEntryResponse:
    dish = entry.dish
    return FoodEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        dish_name=dish.name,
        image_url=dish.image_url,
        calories=float(dish.calories),
        proteins=float(dish.proteins),
        fats=float(dish.fats),
        carbohydrates=float(dish.carbohydrates),
        description=dish.description,
        eaten_at=entry.eaten_at,
        created_at=entry.created_at,
    )
