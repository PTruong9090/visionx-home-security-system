from pydantic_settings import BaseSettings, SettingsConfigDict


class ENV(BaseSettings):
    DATABASE_URL: str
    ALEMBIC_DATABASE_URL: str
    GO2RTC_PUBLIC_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


env = ENV()