import time
from datetime import datetime, timezone
import cv2
import asyncio
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.camera import Camera
from src.models.camera_health_check import CameraHealthCheck, HealthStatusEnum
from src.models.recording import Recording
from src.config.config import env


async def _probe_rtsp(camera: Camera):
    cap = None

    try:
        # UNCOMMENT IN PRODUCTION
        cap = await asyncio.to_thread(cv2.VideoCapture, camera.rtsp_sub_url)
        
        # Testing
        # cap = cv2.VideoCapture(0)

        connected = cap.isOpened()

        if connected:
            frame_exists, frame = cap.read()

        if connected and frame_exists:
            return {
                "status": "online",
                "message": "RTSP connection success and frame received",
                "last_frame_at": datetime.now(timezone.utc)
            }
        
        elif not connected:
            return {
                "status": "offline",
                "message": "RTSP connection failed"
            }
        
        else:
            return {
                "status": "degraded",
                "message": "Connected but no frame received"
            }

    finally:
        if cap:
            cap.release()


async def run_health_check(db: AsyncSession, camera_id: UUID) -> CameraHealthCheck:
    res = await db.execute(select(Camera).where(camera_id == Camera.id))

    camera = res.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    start = time.time()
    
    probe_res = await _probe_rtsp(camera)

    latency_ms = int((time.time() - start) * 1000)

    recording_res = await db.execute(select(Recording.start_time).where(Recording.camera_id == camera.id).order_by(Recording.start_time.desc()).limit(1))
    last_recording_at = recording_res.scalar_one_or_none()

    health_check = CameraHealthCheck(
        camera_id=camera.id,
        status=HealthStatusEnum(probe_res["status"]),
        latency_ms=latency_ms,
        last_frame_at=probe_res.get("last_frame_at"),
        last_recording_at=last_recording_at,
        error_message=probe_res["message"]
    )

    db.add(health_check)
    await db.commit()
    await db.refresh(health_check)
    
    return health_check



async def test_camera_connection(db: AsyncSession, camera_id: UUID):
    result = await db.execute(select(Camera).where(camera_id == Camera.id))

    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    start = time.time()

    probe_res = await _probe_rtsp(camera)

    latency_ms = int((time.time() - start) * 1000)

    return {
        "camera_id": camera.id,
        "status": probe_res["status"],
        "latency_ms": latency_ms,
        "message": probe_res["message"]
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