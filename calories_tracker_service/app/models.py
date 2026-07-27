import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(Base):
    """Lookup table for user roles (3NF: role descriptive attributes live here)."""

    __tablename__ = 'roles'

    code: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    users: Mapped[list['User']] = relationship(back_populates='role')


class User(Base):
    __tablename__ = 'users'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    role_code: Mapped[str] = mapped_column(
        String(20), ForeignKey('roles.code'), nullable=False, default='CUSTOMER'
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    role: Mapped['Role'] = relationship(back_populates='users')
    food_entries: Mapped[list['FoodEntry']] = relationship(back_populates='user', cascade='all, delete-orphan')
    dishes: Mapped[list['Dish']] = relationship(back_populates='created_by')

    @property
    def role_label(self) -> str:
        return self.role_code


class Dish(Base):
    """Dish catalog entity: name, image, macros, description (independent of eating events)."""

    __tablename__ = 'dishes'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_by_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    calories: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    proteins: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fats: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    carbohydrates: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    created_by: Mapped['User'] = relationship(back_populates='dishes')
    food_entries: Mapped[list['FoodEntry']] = relationship(back_populates='dish')


class FoodEntry(Base):
    """Consumption event: who ate which dish, and when (no dish attributes duplicated)."""

    __tablename__ = 'food_entries'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    dish_id: Mapped[str] = mapped_column(String(36), ForeignKey('dishes.id', ondelete='RESTRICT'), nullable=False)
    eaten_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped['User'] = relationship(back_populates='food_entries')
    dish: Mapped['Dish'] = relationship(back_populates='food_entries')
