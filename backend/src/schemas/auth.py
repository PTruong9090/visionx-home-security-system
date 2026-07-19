from pydantic import BaseModel, ConfigDict, EmailStr, Field

from uuid import UUID


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr


class AuthResponse(BaseModel):
    user: AuthUserResponse


class PasswordResetRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)