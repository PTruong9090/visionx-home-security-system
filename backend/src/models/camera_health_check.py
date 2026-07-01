import uuid
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, String, ForeignKey, Text, func, Integer
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class CameraHealthCheck(Base):
    __tablename__ = "camera_health_checks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    camera_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, index=True)

    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    status: Mapped[str] = mapped_column(String, nullable=False)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_frame_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_recording_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    camera = relationship("Camera", back_populates="health_checks")