from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    nutrition_database_url: str = (
        'postgresql+psycopg2://postgres:Hogwarts20014709Swag%3F%3F%3F@localhost:5434/bakery_nutrition'
    )
    redis_url: str = 'redis://127.0.0.1:6379/1'
    celery_broker_url: str = 'redis://127.0.0.1:6379/1'
    celery_result_backend: str = 'redis://127.0.0.1:6379/2'
    internal_api_key: str = 'dev-internal-nutrition-key'
    api_host: str = '0.0.0.0'
    api_port: int = 8000

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')


settings = Settings()
