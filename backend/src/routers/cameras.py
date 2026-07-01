from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.camera import Camera
from src.schemas.camera import CameraCreate, CameraUpdate, CameraResponse

from src.services.camera_service import test_camera_connection, get_camera_stream

router = APIRouter(
    prefix="/api/v1/cameras",
    tags=["cameras"]
)



@router.post('', response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(payload: CameraCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(Camera.stream_key == payload.stream_key))

    exist = result.scalar_one_or_none()

    if exist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Camera stream_key already exists",
        )
    
    camera = Camera(**payload.model_dump())

    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    return camera
    


@router.get('', response_model=list[CameraResponse])
async def get_cameras(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).order_by(Camera.created_at.desc()))

    cameras = result.scalars().all()

    return cameras



@router.get('/{camera_id}', response_model=CameraResponse)
async def get_camera(camera_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(camera_id == Camera.id))

    camera = result.scalar_one_or_none

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )
    
    return camera



@router.patch('/{camera_id}', response_model=CameraResponse)
async def update_camera(camera_id: UUID, payload: CameraUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))

    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )
    
    updates = payload.model_dump(exclude_unset=True)

    for key, value in updates.items():
        setattr(camera, key, value)

    await db.commit()
    await db.refresh(camera)

    return camera



@router.delete('/{camera_id}', response_model=CameraResponse)
async def delete_camera(camera_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))

    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )
    
    await db.delete(camera)
    await db.commit()

    return None



@router.post("/{camera_id}/test")
async def test_camera(camera_id: UUID, db: AsyncSession = Depends(get_db)):
    return await test_camera_connection(db, camera_id)


@router.get("/{camera_id}/stream")
async def get_camera_stream_url(camera_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_camera_stream(db, camera_id)