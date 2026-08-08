from email.message import EmailMessage
from email.utils import formataddr
import logging

import aiosmtplib
from aiosmtplib import SMTPException

from src.config.config import env

logger = logging.getLogger(__name__)


async def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    message = EmailMessage()

    message["From"] = formataddr((
        env.SMTP_FROM_NAME,
        env.SMTP_FROM_EMAIL,
    ))

    message["To"] = to_email
    message["Subject"] = "Reset your password"

    message.set_content(
        "You requested a password reset.\n\n"
        "Use the link below to reset your password:\n\n"
        f"{reset_url}\n\n"
        "If you did not request this password reset, you can ignore this email."
    )

    username = env.SMTP_USERNAME if env.smtp_requires_auth else None
    password = env.SMTP_PASSWORD if env.smtp_requires_auth else None

    try:
        await aiosmtplib.send(
            message,
            hostname=env.SMTP_HOST,
            port=env.SMTP_PORT,
            username=username,
            password=password,
            start_tls=env.SMTP_STARTTLS,
            timeout=10
        )

        return True
    
    except SMTPException:
        logger.exception(
            "SMTP error while sending password reset email via %s:%s",
            env.SMTP_HOST,
            env.SMTP_PORT,
        )
        return False

    except Exception:
        logger.exception(
            "Unexpected error while sending password reset email via %s:%s",
            env.SMTP_HOST,
            env.SMTP_PORT,
        )
        return False
    
