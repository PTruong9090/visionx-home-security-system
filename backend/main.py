from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from src.routers import cameras, auth, users
from src.config.config import env
from src.dependencies.auth import get_current_user


app = FastAPI(title="VisionX API")

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