from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Role
from app.routers.nutrition import router as nutrition_router
from app.routers.internal import router as internal_router


DEFAULT_ROLES = (
    ('CUSTOMER', 'Customer'),
    ('ADMIN', 'Administrator'),
)


def seed_roles():
    db = SessionLocal()
    try:
        existing = {row.code for row in db.scalars(select(Role)).all()}
        for code, name in DEFAULT_ROLES:
            if code not in existing:
                db.add(Role(code=code, name=name))
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_roles()
    yield


app = FastAPI(title='Bakery Nutrition Tracker', version='1.0.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(nutrition_router)
app.include_router(internal_router)


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'nutrition-tracker'}
