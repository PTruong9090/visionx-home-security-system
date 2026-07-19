from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.user import User
from src.schemas.users import UserResponse

from src.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"]
)

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(current_user: AsyncSession = Depends(get_current_user)):
    return current_user