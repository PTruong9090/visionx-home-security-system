from fastapi import FastAPI
from src.routers import cameras
from fastapi.middleware.cors import CORSMiddleware
from src.config.config import env

app = FastAPI(title="VisionX API")

origins = env.CORS_ALLOWED


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cameras.router)

@app.get('/health')
async def health_check():
    return {'status': 'ok'}