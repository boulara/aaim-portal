import os
import logging
import logging.config
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from .database import engine, Base
from .routers import patients, notifications, users, notes, admin, reports
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
        """CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            username VARCHAR NOT NULL,
            name VARCHAR NOT NULL,
            team VARCHAR NOT NULL,
            ip_address VARCHAR,
            user_agent VARCHAR,
            logged_in_at TIMESTAMP DEFAULT NOW()
        )""",
        """CREATE TABLE IF NOT EXISTS shared_reports (
            id VARCHAR PRIMARY KEY,
            created_by VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            expires_at TIMESTAMP NOT NULL
        )""",
        # Rename misspelled column hippa_consent → hipaa_consent
        "ALTER TABLE patients RENAME COLUMN hippa_consent TO hipaa_consent",
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
    logger.info("Starting Conduit")
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    seeder.run()
    logger.info("Startup complete")
    yield
    logger.info("Shutting down")


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)  # disable public API docs in prod


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add HIPAA-relevant security headers to every response."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"]           = "DENY"
        response.headers["X-Content-Type-Options"]    = "nosniff"
        response.headers["Referrer-Policy"]            = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]         = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"]  = "max-age=31536000; includeSubDomains"
        response.headers["Cache-Control"]              = "no-store"
        return response


app.add_middleware(SecurityHeadersMiddleware)

_allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-User-ID"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

app.include_router(patients.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(notes.router)
app.include_router(admin.router)
app.include_router(reports.router)

# ── Serve built React frontend ────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    img_dir = os.path.join(static_dir, "img")
    if os.path.isdir(img_dir):
        app.mount("/img", StaticFiles(directory=img_dir), name="img")

    @app.get("/favicon.svg")
    def serve_favicon():
        return FileResponse(os.path.join(static_dir, "favicon.svg"))

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(static_dir, "index.html"))
