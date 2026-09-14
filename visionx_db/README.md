# visionx-db

Shared database layer for VisionX. Owns the SQLAlchemy `Base`, the async engine
and session factory, and every ORM model. Both `backend/` and `worker/` depend on
it so there is exactly one definition of each table.

Deliberately has no web or job-runner dependencies - SQLAlchemy, asyncpg, and
pydantic-settings only.

## Configuration

Read from the environment, or from a `.env` in the working directory of whichever
app is running:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | - | async connection string, e.g. `postgresql+asyncpg://...` |
| `DB_ECHO` | no | `false` | log every SQL statement |

Unrecognized variables are ignored, so the package can share an app's `.env`.

## Use

```
uv add --editable ../visionx_db
```

Migrations currently live in `backend/alembic`, which points at this package's
metadata.
