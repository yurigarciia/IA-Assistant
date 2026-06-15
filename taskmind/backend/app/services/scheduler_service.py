import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import SessionLocal as async_session
from app.models.task import Task, Notification

log = logging.getLogger(__name__)
_scheduler = AsyncIOScheduler(timezone="America/Sao_Paulo")


async def proactivity_check() -> None:
    from app.services import ollama_service, telegram_service

    _TZ = ZoneInfo("America/Sao_Paulo")
    hora_local = datetime.now(_TZ).hour
    if hora_local < 8 or hora_local >= 23:
        log.info(f"Proactivity check: silêncio noturno ({hora_local}h) — pulando")
        return

    log.info("Proactivity check: iniciando")

    async with async_session() as db:
        result = await db.execute(
            select(Task)
            .options(selectinload(Task.interactions))
            .where(Task.status.notin_(["concluida"]))
        )
        tasks = result.scalars().all()

    if not tasks:
        log.info("Proactivity check: nenhuma tarefa aberta")
        return

    now = datetime.now(timezone.utc)

    COOLDOWN_HORAS = {"critica": 2, "alta": 6, "media": 24, "baixa": 72}

    tasks_context = []

    for t in tasks:
        # Pré-filtro: respeitar cooldown por urgência antes de enviar ao Ollama
        if t.ultimo_lembrete_em:
            horas_desde_lembrete = (now - t.ultimo_lembrete_em).total_seconds() / 3600
            cooldown = COOLDOWN_HORAS.get(t.urgencia, 24)
            if horas_desde_lembrete < cooldown:
                continue

        # Última interação: interaction mais recente ou data de criação
        timestamps = [i.criada_em for i in t.interactions] + [t.criada_em]
        last_interaction = max(timestamps)
        dias_sem_interacao = (now - last_interaction).days

        horas_desde_lembrete = None
        if t.ultimo_lembrete_em:
            horas_desde_lembrete = round((now - t.ultimo_lembrete_em).total_seconds() / 3600, 1)

        tasks_context.append({
            "task_id": str(t.id),
            "titulo": t.titulo,
            "urgencia": t.urgencia,
            "status": t.status,
            "projeto": t.projeto,
            "dias_sem_interacao": dias_sem_interacao,
            "horas_desde_ultimo_lembrete": horas_desde_lembrete,
            "prazo_inf": t.prazo_inf.isoformat() if t.prazo_inf else None,
        })

    log.info(f"Proactivity check: contexto enviado ao Ollama:")
    for ctx in tasks_context:
        log.info(
            f"  [{ctx['urgencia'].upper()}] {ctx['titulo']!r} | status={ctx['status']} "
            f"| dias_sem_interacao={ctx['dias_sem_interacao']} "
            f"| horas_desde_lembrete={ctx['horas_desde_ultimo_lembrete']} "
            f"| prazo={ctx['prazo_inf']}"
        )

    # Ollama decide quem notificar
    if not await ollama_service.is_available():
        log.warning("Proactivity check: Ollama indisponível, pulando")
        return

    selected = await ollama_service.decide_reminders(tasks_context)

    if not selected:
        log.info("Proactivity check: Ollama não selecionou nenhuma tarefa")
        return

    selected_map = {s["task_id"]: s.get("motivo", "") for s in selected}
    tasks_to_notify = [t for t in tasks if str(t.id) in selected_map]

    notify_payload = [
        {
            "titulo": t.titulo,
            "urgencia": t.urgencia,
            "projeto": t.projeto,
            "motivo": selected_map[str(t.id)],
        }
        for t in tasks_to_notify
    ]

    await telegram_service.send_proactivity_notification(notify_payload)

    # Atualiza ultimo_lembrete_em e registra na tabela notifications
    async with async_session() as db:
        for t in tasks_to_notify:
            task_db = await db.get(Task, t.id)
            if task_db:
                task_db.ultimo_lembrete_em = now
                db.add(Notification(
                    task_id=t.id,
                    canal="telegram",
                    mensagem=f"Lembrete proativo: {t.titulo}",
                ))
        await db.commit()

    log.info(f"Proactivity check: {len(tasks_to_notify)} lembretes enviados")


async def daily_summary() -> None:
    from app.services import telegram_service

    async with async_session() as db:
        result = await db.execute(select(Task).where(Task.status.notin_(["concluida"])))
        tasks = result.scalars().all()

    if not tasks:
        await telegram_service.send_message("☀️ *Bom dia!* Nenhuma tarefa aberta hoje. 🎉")
        return

    criticas = [t for t in tasks if t.urgencia == "critica"]
    altas = [t for t in tasks if t.urgencia == "alta"]

    lines = [f"☀️ *Bom dia! Você tem {len(tasks)} tarefa(s) aberta(s).*\n"]

    if criticas:
        lines.append(f"🔴 *Críticas ({len(criticas)}):*")
        for t in criticas[:3]:
            lines.append(f"  • {t.titulo}")

    if altas:
        lines.append(f"\n🟠 *Alta prioridade ({len(altas)}):*")
        for t in altas[:3]:
            lines.append(f"  • {t.titulo}")

    if not criticas and not altas:
        lines.append("Nenhuma tarefa crítica ou alta no momento. Bom dia! 😊")

    await telegram_service.send_message("\n".join(lines))


def start_scheduler() -> None:
    _scheduler.add_job(
        proactivity_check,
        "interval",
        minutes=15,
        id="proactivity",
        replace_existing=True,
        misfire_grace_time=60,
    )
    _scheduler.add_job(
        daily_summary,
        "cron",
        hour=8,
        minute=0,
        id="daily_summary",
        replace_existing=True,
    )
    _scheduler.start()
    log.info("Scheduler iniciado (proatividade a cada 15min, resumo diário às 8h)")


def stop_scheduler() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        log.info("Scheduler encerrado")
