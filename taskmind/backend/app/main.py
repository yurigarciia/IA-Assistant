import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import tasks
from app.services import scheduler_service, telegram_service

log = logging.getLogger(__name__)

_polling_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _polling_task
    scheduler_service.start_scheduler()
    _polling_task = asyncio.create_task(telegram_service.start_polling())
    yield
    scheduler_service.stop_scheduler()
    if _polling_task and not _polling_task.done():
        _polling_task.cancel()
        try:
            await _polling_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="TaskMind API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(tasks.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}
