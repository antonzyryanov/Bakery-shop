from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import settings
from app.schemas import QueueTaskRequest
from app.tasks import process_queue_message

router = APIRouter(prefix='/api/v1/internal', tags=['internal'])


def require_internal_key(x_internal_api_key: str = Header(default='')):
    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail='Invalid internal API key.')


@router.post('/queue', dependencies=[Depends(require_internal_key)])
def enqueue_task(payload: QueueTaskRequest):
    task_id = process_queue_message.delay(payload.model_dump()).id
    return {'task_id': task_id, 'status': 'queued'}
