from pydantic_settings import BaseSettings, SettingsConfigDict


class ENV(BaseSettings):
    DATABASE_URL: str
    ALEMBIC_DATABASE_URL: str
    GO2RTC_PUBLIC_URL: str
    CORS_ALLOWED: list[str]
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


env = ENV()