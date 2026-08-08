import secrets
import hashlib
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.config import env
from src.database import get_db
from src.models.user import User
from src.models.reset_password import ResetPasswordToken
from src.schemas.reset_password import PasswordResetRequest, PasswordResetResponse, ForgotPasswordRequest
from src.services.auth_services import AuthService
from src.services.email_service import send_password_reset_email

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Auth"]
)

auth_service = AuthService()

@router.post('/forgot-password', response_model=PasswordResetResponse, status_code=status.HTTP_200_OK)
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    normalized_email = data.email.strip().lower()
    # Verify Email
    res = await db.execute(select(User).where(User.email == normalized_email))
    user = res.scalar_one_or_none()

    if user:
        # Revoke all old tokens
        await db.execute(update(ResetPasswordToken).where(
            ResetPasswordToken.user_id == user.id,
            ResetPasswordToken.used_at.is_(None),
            ResetPasswordToken.revoked_at.is_(None),
        ).values(revoked_at=now))

        # Create token
        raw_token = secrets.token_urlsafe(32)

        # Store token in DB
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        reset_token = ResetPasswordToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=now + timedelta(minutes=env.RESET_TOKEN_EXPIRE_MINUTES),
        )

        db.add(reset_token)

        await db.commit()

        # Send message with token
        reset_url = f"{env.FRONTEND_URL}/reset-password?token={raw_token}"

        background_tasks.add_task(
            send_password_reset_email,
            user.email,
            reset_url
        )



    return PasswordResetResponse(
        message="If an account exists with that email, a reset link has been sent."
    )


@router.post('/reset-password', response_model=PasswordResetResponse)
async def reset_password(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Verify token (check if its valid and not revoked)
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()

    res = await db.execute(select(ResetPasswordToken)
        .where(
            ResetPasswordToken.token_hash == token_hash,
            ResetPasswordToken.used_at.is_(None),
            ResetPasswordToken.revoked_at.is_(None),
            ResetPasswordToken.expires_at > func.now(),
            ).with_for_update())

    reset_token = res.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Change password
    user = await db.get(User, reset_token.user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    user.password_hash = auth_service.hash_password(data.new_password)
    user.password_changed_at = now

    # Set used at and revoke token
    reset_token.used_at = now

    await db.execute(update(ResetPasswordToken).where(
            ResetPasswordToken.user_id == user.id,
            ResetPasswordToken.used_at.is_(None),
            ResetPasswordToken.revoked_at.is_(None),
        ).values(revoked_at=now))
    

    await db.commit()

    return PasswordResetResponse(
        message="Password reset successful"
    )