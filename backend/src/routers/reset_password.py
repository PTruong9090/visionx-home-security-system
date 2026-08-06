from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.user import User
from src.schemas.reset_password import PasswordResetRequest, PasswordResetResponse, ForgotPasswordRequest


router = APIRouter(
    prefix="/api/v1/auth"
    tags=["Auth"]
)


@router.post('/forgot-password', response_model=PasswordResetResponse)
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db), )