import time
import cv2
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.camera import Camera
from src.config.config import env


async def test_camera_connection(db: AsyncSession, camera_id: UUID):
    result = await db.execute(select(Camera).where(camera_id == Camera.id))

    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )
    
    start = time.time()

    # UNCOMMENT IN PRODUCTION
    cap = cv2.VideoCapture(camera.rtsp_main_url)
    
    # Testing
    # cap = cv2.VideoCapture(0)

    ok = cap.isOpened()

    cap.release()

    latency_ms = int((time.time() - start) * 1000)

    if not ok:
        return {
            "camera_id": camera.id,
            "status": "offline",
            "latency_ms": latency_ms,
            "message": "RTSP connection failed",
        }
    
    return {
        "camera_id": camera.id,
        "status": "online",
        "latency_ms": latency_ms,
        "message": "RTSP connection successful",
    }


async def get_camera_stream(db: AsyncSession, camera_id: UUID):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )
    
    if not camera.enabled:
        raise HTTPException(
            status_code=400,
            detail="Camera is disabled"
        )
    
    return {
        "camera_id": camera.id,
        "main_stream_url": f"{env.GO2RTC_PUBLIC_URL}/stream.html?src={camera.stream_key}_main&mode=webrtc",
        "sub_stream_url": f"{env.GO2RTC_PUBLIC_URL}/stream.html?src={camera.stream_key}_sub&mode=webrtc",
        "stream_type": "webrtc",
    }