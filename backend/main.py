from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from src.routers import cameras, auth, users, health, reset_password
from src.config.config import env
from src.dependencies.auth import get_current_user
from src.services.scheduler_service import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_client = redis.from_url(
        env.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )

    scheduler_started = False

    try:
        await redis_client.ping()
    
        app.state.redis = redis_client

        start_scheduler()

        scheduler_started = True

        yield

    finally:
        if scheduler_started:
            shutdown_scheduler()
        await redis_client.aclose()

app = FastAPI(title="VisionX API", lifespan=lifespan)

origins = env.CORS_ALLOWED

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reset_password.router)

app.include_router(
    cameras.router,
    dependencies=[Depends(get_current_user)]
    )

app.include_router(
    users.router,
    dependencies=[Depends(get_current_user)]
    )

app.include_router(
    health.router,
    dependencies=[Depends(get_current_user)]
)

    
@app.get('/health')
async def health_check():
    return {'status': 'ok'}