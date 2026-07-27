from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers.nutrition import router as nutrition_router
from app.routers.internal import router as internal_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
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
