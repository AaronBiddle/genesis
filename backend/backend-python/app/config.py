from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    api_key: str
    api_base_url: str
    api_model: str
    environment: str
    allowed_origins: str
    max_tokens: int = 2000
    temperature: float = 0.7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings():
    return Settings()