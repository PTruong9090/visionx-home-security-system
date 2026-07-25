from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
import asyncio

from src.database import SessionLocal
from src.models.camera import Camera
from src.services.camera_service import run_health_check

from src.config.config import env


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


scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(
        run_scheduled_health_checks,
        "interval",
        seconds=env.HEALTH_CHECK_INTERVAL_SECONDS
    )
    
    scheduler.start()


def shutdown_scheduler():
    scheduler.shutdown()
