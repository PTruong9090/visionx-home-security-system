from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator, EmailStr
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
    STREAM_RECONCILE_INTERVAL_SECONDS: int = 900

    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    COOKIE_DOMAIN: str | None = None

    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    FRONTEND_URL: str
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: EmailStr
    SMTP_FROM_NAME: str = "VisionX"
    SMTP_STARTTLS: bool = True

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

    @field_validator("SMTP_USERNAME", "SMTP_PASSWORD", mode="before")
    @classmethod
    def _strip_credentials(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.strip()
        
        return v
    
    @model_validator(mode="after")
    def _check_cookie_flags(self):
        if self.COOKIE_SAMESITE == "none" and not self.COOKIE_SECURE:
            raise ValueError("COOKIE_SECURE can't be false when COOKIE_SAMESITE is none")

        return self

    @model_validator(mode="after")
    def _check_smtp_tls(self):
        if self.SMTP_PORT == 465:
            raise ValueError("Implicit TLS on 465 is not supported, use 587 with STARTTLS")

        if not self.SMTP_STARTTLS and (self.SMTP_USERNAME or self.SMTP_PASSWORD):
            raise ValueError(
                "SMTP credentials are set but SMTP_STARTTLS is false, which would send "
                "them in plaintext. Enable SMTP_STARTTLS, or clear SMTP_USERNAME and "
                "SMTP_PASSWORD."
            )

        if bool(self.SMTP_USERNAME) != bool(self.SMTP_PASSWORD):
            missing, present = (
                ("SMTP_USERNAME", "SMTP_PASSWORD")
                if not self.SMTP_USERNAME
                else ("SMTP_PASSWORD", "SMTP_USERNAME")
            )
            raise ValueError(
                f"{missing} is empty but {present} is set. SMTP credentials must be "
                "provided together, or both left empty for a server that takes no auth."
            )


        return self

    @property
    def smtp_requires_auth(self) -> bool:
        return bool(self.SMTP_USERNAME and self.SMTP_PASSWORD)

env = ENV()
