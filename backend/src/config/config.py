from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class ENV(BaseSettings):
    DATABASE_URL: str
    ALEMBIC_DATABASE_URL: str
    GO2RTC_PUBLIC_URL: str
    CORS_ALLOWED: list[str]
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    HEALTH_CHECK_INTERVAL_SECONDS: int = 300
    RTSP_TIMEOUT_MS: int = 5000

    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    COOKIE_DOMAIN: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


env = ENV()