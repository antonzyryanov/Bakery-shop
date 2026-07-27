# Redis for Celery broker and Node.js ↔ Python nutrition queue

Local development uses the Redis instance from `docker-compose.yml`.

- Config: `redis/redis.conf`
- Broker DB: `1` (Celery)
- Result backend DB: `2` (Celery)
- Node queue list key: `bakery:nutrition:queue`

Start with Docker Compose:

```bash
docker compose up redis -d
```
