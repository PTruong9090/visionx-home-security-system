from fastapi import FastAPI
from src.routers import cameras

app = FastAPI(title="VisionX API")

app.include_router(cameras.router)

@app.get('/health')
async def health_check():
    return {'status': 'ok'}