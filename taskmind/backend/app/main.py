import asyncio
import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import tasks
from app.services import scheduler_service, telegram_service

log = logging.getLogger(__name__)

_polling_task: asyncio.Task | None = None


async def _startup_checks() -> None:
    from app.services.ollama_service import is_available as ollama_ok
    from app.config import settings

    log.info("=== TaskMind API v0.2.0 iniciando ===")

    # Ollama
    if await ollama_ok():
        log.info(f"[OK] Ollama disponível — modelo: {settings.ollama_model}")
    else:
        log.warning(f"[WARN] Ollama indisponível em {settings.ollama_base_url} — proatividade desabilitada")

    # Gemini
    if settings.gemini_api_key:
        log.info("[OK] Gemini API key configurada")
    else:
        log.warning("[WARN] GEMINI_API_KEY não configurada — fallback por palavras-chave ativo")

    # Telegram
    if settings.telegram_bot_token and settings.telegram_chat_id:
        log.info(f"[OK] Telegram configurado — chat_id: {settings.telegram_chat_id}")
    else:
        log.warning("[WARN] Telegram não configurado — notificações desabilitadas")

    log.info("=====================================")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _polling_task
    await _startup_checks()
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
