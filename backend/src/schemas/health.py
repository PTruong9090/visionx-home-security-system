from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from src.models.camera_health_check import HealthStatusEnum


class CameraHealthCheckResponse(BaseModel):
    id: UUID
    camera_id: UUID
    status: HealthStatusEnum
    latency_ms: int | None = None
    last_frame_at: datetime | None = None
    last_recording_at: datetime | None = None
    message: str | None = None
    checked_at: datetime | None = None

    model_config={
        "from_attributes":True
    }
