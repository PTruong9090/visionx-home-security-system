from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class CameraCreate(BaseModel):
    name: str
    location: str | None = None
    rtsp_url: str
    steam_key: str
    recording_enabled: bool = True


class CameraUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    rtsp_url: str | None = None
    stream_key: str | None = None
    enabled: bool | None = None
    recording_enabled: bool | None = None
    health_check_enabled: bool | None = None


class CameraResponse(BaseModel):
    id: UUID
    name: str
    location: str | None
    stream_key: str
    enabled: bool
    recording_enabled: bool
    health_check_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }