from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class userCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str | None = None
    role: str | None = None
    created_at: datetime
    updated_at: datetime

    mode_config = {
        "from_attributes": True
    }