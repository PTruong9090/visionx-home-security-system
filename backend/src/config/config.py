from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator
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

    @field_validator("COOKIE_DOMAIN")
    @classmethod
    def _blank_domain_to_none(cls, v: str | None) -> str | None:
        if not v or v.isspace():
            return None

        return v.strip()


    @field_validator("COOKIE_SAMESITE", mode="before")
    @classmethod
    def _lowercase_samesite(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.strip().lower()

        return v
    
    @model_validator(mode="after")
    def _check_cookie_flags(self):
        if self.COOKIE_SAMESITE == "none" and not self.COOKIE_SECURE:
            raise ValueError("COOKIE_SECURE can't be false when COOKIE_SAMESITE is None")

        return self

env = ENV()