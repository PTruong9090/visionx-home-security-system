import httpx
from src.config.config import env

class Go2RTCService:
    def __init__(self, base_url: str = env.GO2RTC_PUBLIC_URL) -> None:
        self.base_url = base_url.rstrip("/")


    async def create_stream(self, stream_key: str, rtsp_url: str) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.put(
                f"{self.base_url}/api/streams",
                params={
                    "name": stream_key,
                    "src": rtsp_url,
                },
            )

            response.raise_for_status()

    async def update_stream(self, stream_key: str, rtsp_url: str) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.put(
                f"{self.base_url}/api/streams",
                params={
                    "name": stream_key,
                    "src": rtsp_url,
                }
            )

            response.raise_for_status()


    async def delete_stream(self, stream_key: str) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(
                f"{self.base_url}/api/streams",
                params={
                    "src": stream_key,
                }
            )

            response.raise_for_status()

def get_go2rtc_service() -> Go2RTCService:
    return Go2RTCService()