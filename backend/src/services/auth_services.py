from uuid import UUID
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
import bcrypt

from src.config.config import env

class AuthService:
    def create_access_token(self, user_id: UUID) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=env.ACCESS_TOKEN_EXPIRE_MINUTES)

        payload = {
            "sub": str(user_id),
            "exp": expires_at
        }

        return jwt.encode(
            payload,
            env.JWT_SECRET_KEY,
            algorithm=env.JWT_ALGORITHM
        )


    def hash_password(self, plain_password: str) -> str:
        hashed_password = bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt())
        return hashed_password.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    def decode_access_token(self, token: str) -> UUID:
        try:
            payload = jwt.decode(token, env.JWT_SECRET_KEY, algorithms=[env.JWT_ALGORITHM])

            user_id = payload.get("sub")

            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials"
                )
            
            return UUID(user_id)
        
        except (JWTError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token"
            )