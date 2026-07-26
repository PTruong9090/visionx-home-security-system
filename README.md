# VisionX

Self-hosted home security system for RTSP/IP cameras. Live streaming, recording, camera
health monitoring, and local AI detection, with no cloud dependency and no subscription.

Video never leaves the network. Detection runs on your own hardware.

## Status

Active development. What works today:

- [x] Camera CRUD with per-camera stream keys
- [x] JWT auth (signup, login, logout, protected routes)
- [x] WebRTC live view via go2rtc restreaming
- [x] Scheduled camera health checks with RTSP reachability probing
- [x] React dashboard with camera grid and detail views
- [ ] Motion gate and object detection (`worker/` is a stub)
- [ ] Recording and snapshot capture
- [ ] Event timeline and semantic search

The AI pipeline is designed but not yet built. See
[ADR 0001](docs/adr/0001-ai-detection-pipeline.md) for the architecture and the reasoning
behind it.

## Architecture

```
  IP cameras (RTSP)
        │
        ├──────────────┐
        │              │
   main stream    sub stream
        │              │
        ▼              ▼
   ┌─────────┐   ┌──────────┐
   │ go2rtc  │   │  worker  │  motion gate -> detector -> events
   └────┬────┘   └────┬─────┘
        │             │
   WebRTC/RTSP        │
        │             ▼
        │        ┌──────────┐
        └───────>│ FastAPI  │<────> Postgres
                 └────┬─────┘
                      │
                 ┌────▼─────┐
                 │  React   │
                 └──────────┘
```

Cameras expose two RTSP streams. The high-resolution main stream is for viewing and
recording; the low-resolution substream feeds detection. That split is the single largest
efficiency decision in the system and is why `Camera` stores both URLs.

## Layout

| Path | What |
| --- | --- |
| `backend/` | FastAPI service: auth, cameras, health checks, SQLAlchemy + Alembic |
| `frontend/` | React 19 + Vite + Tailwind dashboard |
| `worker/` | Detection pipeline (planned, see ADR 0001) |
| `docker/go2rtc/` | go2rtc restream configuration |
| `docs/adr/` | Architecture decision records |

## Stack

- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0 (async, asyncpg), Alembic, APScheduler
- **Frontend:** React 19, Vite, Tailwind 4, Radix Themes, React Router 7
- **Streaming:** go2rtc (RTSP ingest, WebRTC output)
- **Database:** PostgreSQL

## Setup

### Prerequisites

- Python 3.13 and [uv](https://docs.astral.sh/uv/)
- Node 20+
- Docker (for go2rtc)
- A running PostgreSQL instance
- At least one RTSP camera on the network

### 1. go2rtc

```bash
cp docker/go2rtc/go2rtc.yaml.example docker/go2rtc/go2rtc.yaml
```

Edit `docker/go2rtc/go2rtc.yaml`:

- Set `webrtc.candidates` to your host's LAN IP, not `localhost`. WebRTC needs a real
  address to hand to the browser.
- Add a stream entry per camera. Add both the main and sub streams; the substream will be
  needed by the worker.

```bash
docker compose up -d
```

The go2rtc UI is at `http://localhost:1984`. Confirm each stream plays there before
touching the app. If it does not play in go2rtc, it will not play in VisionX.

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | async driver, `postgresql+asyncpg://...` |
| `ALEMBIC_DATABASE_URL` | sync driver, `postgresql+psycopg://...`, same database |
| `GO2RTC_PUBLIC_URL` | address the **browser** reaches go2rtc on, not the container |
| `CORS_ALLOWED` | JSON array of frontend origins |
| `JWT_SECRET_KEY` | generate one, e.g. `openssl rand -hex 32` |
| `HEALTH_CHECK_INTERVAL_SECONDS` | how often cameras are probed |

Two database URLs are required because the app runs async and Alembic runs sync. They must
point at the same database.

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

API docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard at `http://localhost:5173`. Create an account through the signup page.

## API

All routes are under `/api/v1`. Everything except `/auth/*` requires a bearer token.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create account |
| `POST` | `/auth/login` | Get access token |
| `POST` | `/auth/logout` | Invalidate session |
| `GET` | `/users/me` | Current user |
| `GET` | `/cameras` | List cameras |
| `POST` | `/cameras` | Add camera |
| `GET` | `/cameras/{id}` | Camera detail |
| `PATCH` | `/cameras/{id}` | Update camera |
| `DELETE` | `/cameras/{id}` | Remove camera |
| `POST` | `/cameras/{id}/test` | Probe RTSP reachability now |
| `GET` | `/cameras/{id}/stream` | Stream credentials for the player |
| `GET` | `/health/{camera_id}` | Latest health check result |

`GET /health` (unauthenticated, no prefix) is the service liveness probe.

## Development notes

**Migrations.** Alembic autogenerate needs models imported in `backend/src/models/__init__.py`
or it will produce an empty migration.

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

**Stream keys.** Each camera gets a generated stream key rather than exposing RTSP
credentials to the frontend. Camera passwords stay server-side.

**Health checks.** APScheduler starts in the FastAPI lifespan hook and probes each camera
with `health_check_enabled` on its interval, writing to `camera_health_checks`.

## Roadmap

Ordered, per [ADR 0001](docs/adr/0001-ai-detection-pipeline.md):

1. Motion gate in `worker/`, reading the substream. No ML. Measure the frame pass rate.
2. YOLO on ONNX Runtime behind the gate, writing `Event` rows.
3. Object tracking and session clustering, so one person walking past is one event.
4. Bounded enrichment queue: CLIP embeddings, attributes, semantic search.
5. Detection review UI and a model evaluation harness.

Postgres and the backend are not yet in `docker-compose.yaml`; only go2rtc is. The worker
will join that stack.

## Documentation

- [Architecture Decision Records](docs/adr/)
  - [ADR 0001: AI Detection Pipeline Architecture](docs/adr/0001-ai-detection-pipeline.md)
- `docs/VisionX_Overview.pdf`
- `docs/VisionX_API_Design_README.pdf`

## License

See [LICENSE](LICENSE).
