from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
import asyncio
from typing import Any
import httpx
import logging
from datetime import datetime, timezone

from src.database import SessionLocal
from src.models.camera import Camera
from src.services.camera_service import run_health_check

from src.config.config import env

from src.services.go2rtc_service import get_go2rtc_service

logger = logging.getLogger(__name__)

# HELPER FUNCTIONS
def _producer_url(stream: dict[str, Any]) -> str | None:
    producers = stream.get('producers') or []

    if not producers:
        return None

    return producers[0].get('url')


async def run_health_check_isolated(camera_id):
    async with SessionLocal() as db:
        await run_health_check(db, camera_id)


async def run_scheduled_health_checks():
    async with SessionLocal() as db:
        res = await db.execute(select(Camera.id).where(
            Camera.enabled == True,
            Camera.health_check_enabled == True
        ))

        cameras_id = res.scalars().all()

    await asyncio.gather(*(run_health_check_isolated(cid) for cid in cameras_id), return_exceptions=True)


async def run_scheduled_stream_reconciliation():
    go2rtc = get_go2rtc_service()

    async with SessionLocal() as db:
        res = await db.execute(
            select(
                Camera.stream_key, 
                Camera.rtsp_main_url, 
                Camera.rtsp_sub_url)
            .where(Camera.enabled.is_(True)))

        cameras = res.all()

    # Database connection releases

    expected: dict[str, str] = {}
    for camera in cameras:
        expected[f"{camera.stream_key}_main"] = camera.rtsp_main_url
        expected[f"{camera.stream_key}_sub"] = camera.rtsp_sub_url

    try:
        streams = await go2rtc.get_streams()
    except httpx.HTTPError:
        logger.warning("stream-reconcile skipped reason=listing-failed", exc_info=True)
        return


    actual = set(streams.keys())

    to_delete = actual - expected.keys()
    to_add = expected.keys() - actual

    if to_delete and not expected:
        logger.error(
            "stream-reconcile aborted reason=empty-expected-set to_delete=%d",
            len(to_delete),
        )
        return

    # In GO2RTC, not in DB
    deleted = 0
    for name in to_delete:
        try:
            await go2rtc.delete_stream(name)
            deleted += 1

        except httpx.HTTPError:
            logger.warning("stream-reconcile delete-failed stream=%s", name, exc_info=True)

    # In DB, not in GO2RTC
    created = 0
    for name in to_add:
        try:
            await go2rtc.create_stream(stream_key=name, rtsp_url=expected[name])
            created += 1

        except httpx.HTTPError:
            logger.warning("stream-reconcile create-failed stream=%s", name, exc_info=True)

    # Both in, update stream info
    stale = {
        name
        for name in expected.keys() & actual
        if _producer_url(streams[name]) not in (None, expected[name])
    }  

    refreshed = 0
    for name in stale:
        try:
            await go2rtc.update_stream(stream_key=name, rtsp_url=expected[name])
            refreshed += 1

        except httpx.HTTPError:
            logger.warning("stream-reconcile refresh-failed stream=%s", name, exc_info=True)

    if deleted or created or refreshed:
        logger.info("stream-reconcile deleted=%d created=%d refreshed=%d", deleted, created, refreshed)


scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(
        run_scheduled_health_checks,
        "interval",
        seconds=env.HEALTH_CHECK_INTERVAL_SECONDS
    )

    scheduler.add_job(
        run_scheduled_stream_reconciliation,
        "interval",
        seconds=env.STREAM_RECONCILE_INTERVAL_SECONDS,
        next_run_time=datetime.now(timezone.utc)
    )
    
    scheduler.start()


def shutdown_scheduler():
    scheduler.shutdown()
