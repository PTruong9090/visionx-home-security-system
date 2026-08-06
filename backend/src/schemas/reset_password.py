from pydantic import BaseModel, Field, EmailStr


class PasswordResetRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=72)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class PasswordResetResponse(BaseModel):
    message: str