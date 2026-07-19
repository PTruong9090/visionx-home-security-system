from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UpdateUser(BaseModel):
    email: EmailStr | None = None
    display_name: str | None = None

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str | None = None
    role: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }