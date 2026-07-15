from uuid import UUID
import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.camera import Camera
from src.schemas.camera import CameraCreate, CameraUpdate, CameraResponse

from src.services.stream_key_service import generate_stream_key
from src.services.camera_service import test_camera_connection, get_camera_stream
from src.services.go2rtc_service import (
    Go2RTCService,
    get_go2rtc_service,
)

router = APIRouter(
    prefix="/api/v1/cameras",
    tags=["cameras"]
)

async def cleanup_partial_streams(go2rtc, camera, main_created, sub_created):
    if sub_created:
        try:
            await go2rtc.delete_stream(
                f"{camera.stream_key}_sub"
            )
        except httpx.HTTPError:
            pass

    if main_created:
        try:
            await go2rtc.delete_stream(
                f"{camera.stream_key}_main"
            )
        except httpx.HTTPError:
            pass


@router.post('', response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(payload: CameraCreate, db: AsyncSession = Depends(get_db), go2rtc: Go2RTCService = Depends(get_go2rtc_service)):

    stream_key = generate_stream_key(payload.name)

    rtsp_sub_url = payload.rtsp_main_url if not payload.rtsp_sub_url else payload.rtsp_sub_url

    camera = Camera(
        **payload.model_dump(exclude={"rtsp_sub_url"}),
        stream_key=stream_key,
        rtsp_sub_url=rtsp_sub_url
    )

    db.add(camera)

    main_created = False
    sub_created = False

    try:
        await db.flush()

        if camera.enabled:
            await go2rtc.create_stream(
                stream_key=f"{camera.stream_key}_main",
                rtsp_url=camera.rtsp_main_url,
            )
            main_created = True

            if camera.rtsp_sub_url:
                await go2rtc.create_stream(
                    stream_key=f"{camera.stream_key}_sub",
                    rtsp_url=camera.rtsp_sub_url
                )
                sub_created = True

        await db.commit()
        await db.refresh(camera)

        return camera

    except httpx.HTTPError as exc:
        await db.rollback()

        await cleanup_partial_streams(go2rtc, camera, main_created, sub_created)

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to register camera with go2rtc"
        ) from exc
    
    except Exception as exc:
        await db.rollback()

        await cleanup_partial_streams(go2rtc, camera, main_created, sub_created)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create camera",
        ) from exc
    


@router.get('', response_model=list[CameraResponse])
async def get_cameras(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).order_by(Camera.created_at.desc()))

    cameras = result.scalars().all()

    return cameras



@router.get('/{camera_id}', response_model=CameraResponse)
async def get_camera(camera_id: UUID, db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(Camera).where(camera_id == Camera.id))

    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )
    
    return camera



@router.patch('/{camera_id}', response_model=CameraResponse)
async def update_camera(camera_id: UUID, payload: CameraUpdate, db: AsyncSession = Depends(get_db), go2rtc: Go2RTCService = Depends(get_go2rtc_service)):

    result = await db.execute(select(Camera).where(Camera.id == camera_id))

    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )

    
    old_main_url = camera.rtsp_main_url
    old_sub_url = camera.rtsp_sub_url
    old_enabled = camera.enabled
    
    updates = payload.model_dump(exclude_unset=True)

    for key, value in updates.items():
        setattr(camera, key, value)

    sub_was_derived = old_sub_url == old_main_url
    sub_explicity_cleared = "rtsp_sub_url" in updates and not camera.rtsp_sub_url
    sub_cascades_from_main = (
        "rtsp_sub_url" not in updates
        and sub_was_derived
        and "rtsp_main_url" in updates
    )

    # Derive from main if 
    if sub_explicity_cleared or sub_cascades_from_main:
        camera.rtsp_sub_url = camera.rtsp_main_url


    main_key = f"{camera.stream_key}_main"
    sub_key = f"{camera.stream_key}_sub"

    try:
        # Enabled -> Disabled
        if old_enabled and not camera.enabled:
            await go2rtc.delete_stream(main_key)

            if old_sub_url:
                await go2rtc.delete_stream(sub_key)

        # Disabled -> Enabled
        elif not old_enabled and camera.enabled:
            await go2rtc.create_stream(
                stream_key=main_key,
                rtsp_url=camera.rtsp_main_url
            )

            if camera.rtsp_sub_url:
                await go2rtc.create_stream(
                    stream_key=sub_key,
                    rtsp_url=camera.rtsp_sub_url,
                )

        # Camera still enabled
        elif camera.enabled:
            if camera.rtsp_main_url != old_main_url:
                await go2rtc.update_stream(
                    stream_key=main_key,
                    rtsp_url=camera.rtsp_main_url
                )

            if camera.rtsp_sub_url != old_sub_url:
                await go2rtc.update_stream(
                    stream_key=sub_key,
                    rtsp_url=camera.rtsp_sub_url
                )

        await db.commit()
        await db.refresh(camera)

        return camera

    except httpx.HTTPError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to update camera for go2rtc"
        ) from exc
    
    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update camera"
        )



@router.delete('/{camera_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(camera_id: UUID, db: AsyncSession = Depends(get_db), go2rtc: Go2RTCService = Depends(get_go2rtc_service)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))

    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )
    
    try:
        await go2rtc.delete_stream(f"{camera.stream_key}_main")

        if camera.rtsp_sub_url:
            await go2rtc.delete_stream(f"{camera.stream_key}_sub")

        await db.delete(camera)
        await db.commit()

        return None

    except httpx.HTTPError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to delete camera from go2rtc"
        ) from exc
    
    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete camera"
        )



@router.post("/{camera_id}/test")
async def test_camera(camera_id: UUID, db: AsyncSession = Depends(get_db)):
    return await test_camera_connection(db, camera_id)


@router.get("/{camera_id}/stream")
async def get_camera_stream_url(camera_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_camera_stream(db, camera_id)