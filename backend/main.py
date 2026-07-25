from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.routers import cameras, auth, users
from src.config.config import env
from src.dependencies.auth import get_current_user

from src.services.scheduler_service import start_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()

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

app.include_router(
    cameras.router,
    dependencies=[Depends(get_current_user)]
    )

app.include_router(
    users.router,
    dependencies=[Depends(get_current_user)]
    )

@app.get('/health')
async def health_check():
    return {'status': 'ok'}