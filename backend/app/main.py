import os
import logging
import logging.config
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text
from .database import engine, Base
from .routers import patients, notifications, users, notes
from . import seed as seeder

# ── Logging ───────────────────────────────────────────────────────────────────
logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {"level": "INFO", "handlers": ["console"]},
    "loggers": {
        "uvicorn.access": {"level": "WARNING"},  # reduce noise from healthchecks
    },
})

logger = logging.getLogger(__name__)


def _run_migrations():
    """Add columns that were introduced after initial deploy (PostgreSQL only)."""
    db_url = str(engine.url)
    if "postgresql" not in db_url:
        return
    migrations = [
        "ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
                logger.info("Migration applied: %s", sql)
            except Exception as exc:
                conn.rollback()
                logger.warning("Migration skipped (%s): %s", sql, exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AAIM Portal")
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    seeder.run()
    logger.info("Startup complete")
    yield
    logger.info("Shutting down")


app = FastAPI(lifespan=lifespan)

app.include_router(patients.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(notes.router)

# ── Serve built React frontend ────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(static_dir, "index.html"))
