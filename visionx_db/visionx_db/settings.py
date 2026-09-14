from pydantic_settings import BaseSettings, SettingsConfigDict


class ENV(BaseSettings):
    DATABASE_URL: str
    DB_ECHO: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


env = ENV()
