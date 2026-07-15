import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    rtsp_main_url: Mapped[str] = mapped_column(String, nullable=False)
    rtsp_sub_url: Mapped[str] = mapped_column(String, nullable=False)
    stream_key: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)

    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    recording_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    health_check_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    recordings = relationship(
        "Recording",
        back_populates="camera",
        cascade="all, delete-orphan"
    )

    health_checks = relationship(
        "CameraHealthCheck",
        back_populates="camera",
        cascade="all, delete-orphan"
    )

    events = relationship(
        "Event",
        back_populates="camera",
        cascade="all, delete-orphan"
    )

    snapshots = relationship(
        "Snapshot",
        back_populates="camera",
        cascade="all, delete-orphan"
    )