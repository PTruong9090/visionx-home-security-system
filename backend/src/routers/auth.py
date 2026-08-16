from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.auth import AuthResponse, LoginRequest, SignupRequest, AuthUserResponse
from src.models.user import User
from src.database import get_db

from src.services.auth_services import AuthService
from src.dependencies.redis import get_redis
from src.services.rate_limit_service import check_rate_limit, clear_rate_limits, peek_rate_limits, record_rate_limit_failures, LOGIN_EMAIL_LIMIT, LOGIN_IP_LIMIT, SIGNUP_IP_LIMIT, LOGIN_EMAIL_IP_LIMIT

from src.utils.cookies import set_auth_cookies, clear_auth_cookies

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Auth"]
)

auth_service = AuthService()



@router.post('/login', response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def login(data: LoginRequest, response: Response, request: Request, redis: Redis = Depends(get_redis), db: AsyncSession = Depends(get_db)):
    normalized_email = data.email.strip().lower()
    client_ip = request.client.host if request.client else "unknown"

    email_ip = f"{normalized_email}|{client_ip}"

    email_checks = [
        (LOGIN_EMAIL_LIMIT, normalized_email),
        (LOGIN_EMAIL_IP_LIMIT, email_ip),
    ]

    checks = [
        (LOGIN_IP_LIMIT, client_ip),
        *email_checks
    ]

    allowed, retry_after = await peek_rate_limits(redis, checks)

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts, try again later",
            headers={"Retry-After": str(retry_after)}
        )

    res = await db.execute(select(User).where(normalized_email == User.email))
    
    user = res.scalar_one_or_none()

    if not user:
        await record_rate_limit_failures(redis, checks)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    password_is_correct = auth_service.verify_password(
        plain_password=data.password,
        hashed_password=user.password_hash,
    )

    if not password_is_correct:
        await record_rate_limit_failures(redis, checks)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Do not clear LOGIN_IP: successful authentication only proves ownership
    # of this account, not that the source IP's prior behavior was legitimate.
    await clear_rate_limits(redis, email_checks)
    
    access_token = auth_service.create_access_token(user.id, user.token_version)

    set_auth_cookies(response, access_token)
    

    return AuthResponse(
        user=AuthUserResponse.model_validate(user)
    )


@router.post('/signup', response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, response: Response, request: Request, redis: Redis = Depends(get_redis), db: AsyncSession = Depends(get_db)):
    normalized_email = data.email.strip().lower()

    client_ip = request.client.host if request.client else "unknown"

    allowed_ip, ip_retry_after = await check_rate_limit(redis, SIGNUP_IP_LIMIT, client_ip)

    if not allowed_ip:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts, try again later",
            headers={"Retry-After": str(ip_retry_after)}
        )

    

    res = await db.execute(select(User).where(normalized_email == User.email))

    if res.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    hashed_password = auth_service.hash_password(data.password)

    user = User(
        display_name=data.name.strip(),
        email=normalized_email,
        password_hash=hashed_password
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = auth_service.create_access_token(user.id, user.token_version)

    set_auth_cookies(response, access_token)

    return AuthResponse(
        user=AuthUserResponse.model_validate(user)
    )


@router.post('/logout', status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    clear_auth_cookies(response)

    