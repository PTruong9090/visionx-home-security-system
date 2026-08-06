from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from uuid import UUID

from src.models import CameraHealthCheck
from src.schemas.health import CameraHealthCheckResponse
from src.database import get_db


router = APIRouter(
    prefix='/api/v1/health'
)


@router.get('/{camera_id}', response_model=CameraHealthCheckResponse | None, status_code=status.HTTP_200_OK)
async def getHealth(camera_id: UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CameraHealthCheck).where(CameraHealthCheck.camera_id == camera_id).order_by(CameraHealthCheck.checked_at.desc()).limit(1))

    health_check = res.scalar_one_or_none()

    return health_check