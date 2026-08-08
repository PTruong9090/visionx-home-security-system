from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.user import User
from src.schemas.users import UserResponse, UpdatePasswordRequest, UpdateEmailRequest

from src.dependencies.auth import get_current_user
from src.services.auth_services import AuthService

auth_service = AuthService()

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"]
)

@router.get("/me", response_model=UserResponse)
async def get_user(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.patch("/password", response_model=UserResponse)
async def change_password(payload: UpdatePasswordRequest, current_user: Annotated[User, Depends(get_current_user)], db: AsyncSession = Depends(get_db)):
    return
    

@router.patch("/change-email", response_model=UserResponse)
async def change_email(current_user: UpdateEmailRequest, db: AsyncSession = Depends(get_db)):
    return