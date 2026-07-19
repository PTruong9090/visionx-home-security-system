from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.user import User
from src.services.auth_services import AuthService

async def get_current_user(access_token: str | None = Cookie(default=None), db: AsyncSession = Depends(get_db)) -> User:
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    auth_service = AuthService()
    user_id = auth_service.decode_access_token(access_token)

    user = await db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )
    
    return user