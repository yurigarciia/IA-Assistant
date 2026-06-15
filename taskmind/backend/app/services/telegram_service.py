import asyncio
import json
import re
import logging
from datetime import datetime, timezone, timedelta

import httpx

from app.config import settings

log = logging.getLogger(__name__)

_BASE = ""
_last_update_id: int = 0

URGENCIA_EMOJI = {"critica": "🔴", "alta": "🟠", "media": "🟡", "baixa": "🟢"}
STATUS_EMOJI = {"concluida": "✅", "em_progresso": "🔵", "aguardando": "⏳", "revisando": "🔍", "aberta": "📋"}


def _base() -> str:
    return f"https://api.telegram.org/bot{settings.telegram_bot_token}"


async def send_message(text: str) -> None:
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"{_base()}/sendMessage", json={
                "chat_id": settings.telegram_chat_id,
                "text": text,
                "parse_mode": "Markdown",
            })
    except Exception as e:
        log.error(f"Telegram send_message error: {e}")


async def send_proactivity_notification(tasks: list[dict]) -> None:
    lines = ["🔔 *Tarefas que precisam de atenção:*\n"]
    for i, t in enumerate(tasks, 1):
        emoji = URGENCIA_EMOJI.get(t.get("urgencia", ""), "⚪")
        line = f"{i}. {emoji} *{t['titulo']}*"
        if t.get("projeto"):
            line += f" — _{t['projeto']}_"
        if t.get("motivo"):
            line += f"\n   ↳ _{t['motivo']}_"
        lines.append(line)
    lines.append("\n_Responda naturalmente para atualizar o status de qualquer tarefa._")
    await send_message("\n".join(lines))


async def _parse_reply_with_gemini(user_text: str, tasks: list) -> list[dict]:
    """Usa Gemini para identificar quais tarefas o usuário menciona e qual ação deseja."""
    if not settings.gemini_api_key:
        return []

    import google.generativeai as genai
    genai.configure(api_key=settings.gemini_api_key)

    tasks_ctx = [
        {"id": str(t.id), "titulo": t.titulo, "status": t.status, "urgencia": t.urgencia, "projeto": t.projeto}
        for t in tasks
    ]

    prompt = f"""O usuário do TaskMind respondeu via Telegram: "{user_text}"

Tarefas que foram notificadas recentemente (contexto):
{json.dumps(tasks_ctx, ensure_ascii=False, indent=2)}

Analise a mensagem do usuário e identifique quais tarefas ele menciona (explicitamente ou implicitamente pelo contexto).
Para cada tarefa identificada, determine a ação desejada.

Status válidos: aberta, em_progresso, aguardando, revisando, concluida

Retorne SOMENTE JSON válido:
[
  {{
    "task_id": "uuid da tarefa",
    "acao": "status_change" | "comentario" | "ignorar",
    "novo_status": "status válido ou null",
    "comentario": "texto do comentário ou null"
  }}
]

Se a resposta não se refere claramente a nenhuma tarefa, retorne []."""

    try:
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"},
        )
        response = model.generate_content(prompt)
        match = re.search(r"\[.*\]", response.text, re.DOTALL)
        if not match:
            return []
        return json.loads(match.group())
    except Exception as e:
        log.error(f"Gemini reply parse error: {e}")
        return []


async def _process_reply(user_text: str) -> None:
    from app.db import SessionLocal as async_session
    from app.models.task import Task, Interaction, Notification
    from sqlalchemy import select

    # Busca tarefas notificadas nas últimas 24h para dar contexto ao Gemini
    async with async_session() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        notifs_result = await db.execute(
            select(Notification)
            .where(Notification.canal == "telegram")
            .where(Notification.enviada_em >= cutoff)
            .where(Notification.task_id.isnot(None))
        )
        task_ids = list({n.task_id for n in notifs_result.scalars().all()})

        if not task_ids:
            await send_message("✓ Entendido!")
            return

        tasks_result = await db.execute(select(Task).where(Task.id.in_(task_ids)))
        recent_tasks = tasks_result.scalars().all()

    actions = await _parse_reply_with_gemini(user_text, recent_tasks)

    if not actions:
        await send_message("Entendido! Se quiser atualizar alguma tarefa, pode me dizer qual e o que fazer.")
        return

    confirmations = []
    async with async_session() as db:
        for action in actions:
            if action.get("acao") == "ignorar":
                continue

            task_id_str = action.get("task_id")
            task = next((t for t in recent_tasks if str(t.id) == task_id_str), None)
            if not task:
                continue

            task_db = await db.get(Task, task.id)
            if not task_db:
                continue

            if action["acao"] == "status_change" and action.get("novo_status"):
                novo = action["novo_status"]
                task_db.status = novo
                task_db.atualizada_em = datetime.now(timezone.utc)
                if novo == "concluida":
                    task_db.concluida_em = datetime.now(timezone.utc)
                db.add(Interaction(
                    task_id=task_db.id,
                    tipo="status_change",
                    conteudo=f"Status → {novo} (via Telegram)",
                ))
                emoji = STATUS_EMOJI.get(novo, "📝")
                confirmations.append(f"{emoji} *{task_db.titulo}* → {novo.replace('_', ' ')}")

            elif action["acao"] == "comentario" and action.get("comentario"):
                db.add(Interaction(
                    task_id=task_db.id,
                    tipo="comentario",
                    conteudo=action["comentario"],
                ))
                task_db.atualizada_em = datetime.now(timezone.utc)
                confirmations.append(f"💬 *{task_db.titulo}*: {action['comentario']}")

        await db.commit()

    if confirmations:
        await send_message("Atualizado:\n" + "\n".join(confirmations))
    else:
        await send_message("✓ Entendido!")


async def _cmd_tasks() -> None:
    from app.db import SessionLocal as async_session
    from app.models.task import Task
    from sqlalchemy import select

    async with async_session() as db:
        result = await db.execute(
            select(Task).where(Task.status.notin_(["concluida"])).order_by(Task.criada_em)
        )
        tasks = result.scalars().all()

    if not tasks:
        await send_message("Nenhuma tarefa aberta no momento. 🎉")
        return

    order = {"critica": 0, "alta": 1, "media": 2, "baixa": 3}
    tasks = sorted(tasks, key=lambda t: order.get(t.urgencia, 9))

    lines = [f"📋 *{len(tasks)} tarefa(s) aberta(s):*\n"]
    for t in tasks:
        emoji = URGENCIA_EMOJI.get(t.urgencia, "⚪")
        status_emoji = STATUS_EMOJI.get(t.status, "📋")
        line = f"{emoji} *{t.titulo}*"
        if t.projeto:
            line += f" _{t.projeto}_"
        line += f"\n   {status_emoji} {t.status.replace('_', ' ')}"
        if t.prazo_inf:
            line += f" · prazo {t.prazo_inf.strftime('%d/%m')}"
        lines.append(line)

    await send_message("\n".join(lines))


async def _cmd_nova(texto: str) -> None:
    if not texto:
        await send_message("Use: /nova <descrição da tarefa>")
        return

    await send_message("⏳ Processando...")
    try:
        from app.services.ai_service import parse_task
        from app.services.task_service import create_task
        from app.db import SessionLocal as async_session

        parsed, _ = await parse_task(texto)
        async with async_session() as db:
            task = await create_task(db, parsed)

        emoji = URGENCIA_EMOJI.get(task.urgencia, "⚪")
        msg = f"✅ Tarefa criada:\n{emoji} *{task.titulo}*"
        if task.projeto:
            msg += f" — _{task.projeto}_"
        if task.tags:
            msg += f"\n🏷 {', '.join(task.tags)}"
        if task.prazo_inf:
            msg += f"\n📅 Prazo: {task.prazo_inf.strftime('%d/%m/%Y')}"
        msg += f"\n⚡ Urgência: {task.urgencia}"
        await send_message(msg)
    except Exception as e:
        log.error(f"Telegram /nova error: {e}")
        await send_message("❌ Erro ao criar tarefa. Tente novamente.")


async def start_polling() -> None:
    global _last_update_id

    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        log.warning("Telegram não configurado — polling desabilitado")
        return

    log.info("Telegram polling iniciado")

    async with httpx.AsyncClient(timeout=40) as client:
        while True:
            try:
                r = await client.get(
                    f"{_base()}/getUpdates",
                    params={
                        "offset": _last_update_id + 1,
                        "timeout": 30,
                        "allowed_updates": ["message"],
                    },
                )
                updates = r.json().get("result", [])

                for update in updates:
                    _last_update_id = update["update_id"]
                    msg = update.get("message", {})
                    chat_id = str(msg.get("chat", {}).get("id", ""))
                    text = msg.get("text", "").strip()

                    if chat_id != str(settings.telegram_chat_id) or not text:
                        continue

                    if text.startswith("/tasks"):
                        asyncio.create_task(_cmd_tasks())
                    elif text.startswith("/nova "):
                        asyncio.create_task(_cmd_nova(text[6:].strip()))
                    elif text.startswith("/nova"):
                        asyncio.create_task(send_message("Use: /nova <descrição da tarefa>"))
                    elif not text.startswith("/"):
                        asyncio.create_task(_process_reply(text))

            except asyncio.CancelledError:
                log.info("Telegram polling encerrado")
                break
            except Exception as e:
                log.error(f"Telegram polling error: {e}")
                await asyncio.sleep(5)
