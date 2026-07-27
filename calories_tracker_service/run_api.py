import uvicorn

from app.api import app
from app.config import settings

if __name__ == '__main__':
    uvicorn.run('app.api:app', host=settings.api_host, port=settings.api_port, reload=True)
