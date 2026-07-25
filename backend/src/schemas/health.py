from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from src.models.camera_health_check import HealthStatusEnum


class CameraHealthCheckResponse(BaseModel):
    id: UUID
    status: HealthStatusEnum
    latency_ms: int
    last_frame_at: datetime | None = None
    last_recording_at: datetime | None = None
    error_message: str | None = None

    model_config={
        "from_attributes":True
    }
