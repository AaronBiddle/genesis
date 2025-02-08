from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    api_key: str = Field(alias='DEEPSEEK_API_KEY')
    api_base_url: str = Field(alias='DEEPSEEK_API_BASE_URL')
    api_model: str = Field(alias='DEEPSEEK_API_MODEL')
    environment: str
    allowed_origins: str
    max_tokens: int = 2000
    temperature: float = 0.7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = 'ignore'  # Ignore extra fields in env file

@lru_cache()
def get_settings():
    return Settings()