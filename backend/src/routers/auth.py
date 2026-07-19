from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.auth import AuthResponse, LoginRequest, SignupRequest, AuthUserResponse, PasswordResetRequest
from src.models.user import User
from src.database import get_db

from src.services.auth_services import AuthService

from src.config.config import env

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Auth"]
)


@router.post('/login', response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(data.email == User.email))

    if not res:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = res.scalar_one_or_none()

    password_is_correct = AuthService.verify_password(
        plain_password=data.password,
        hashed_password=user.password_hash,
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    access_token = AuthService.create_access_token(user.id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=env.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post('/signup', response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(data.email.lower() == User.email))

    if res is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    hashed_password = AuthService.hash_password(data.password)

    user = User(
        name=data.name.strip(),
        email=str(data.email).strip().lower(),
        password_hash=hashed_password
    )

    db.add(user)
    await db.commit()
    await db.refresh()


@router.post('/logout', response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie("access_token")

    