import json
import re
import logging
import httpx
from app.config import settings

log = logging.getLogger(__name__)


async def _generate(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(
            f"{settings.ollama_base_url}/api/generate",
            json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
        )
        r.raise_for_status()
        return r.json()["response"]


async def decide_reminders(tasks_context: list[dict]) -> list[dict]:
    """Pergunta ao Ollama quais tarefas merecem lembrete agora. Retorna [{task_id, motivo}]."""
    if not tasks_context:
        return []

    if not settings.ollama_base_url:
        return []

    prompt = f"""Você é um assistente de produtividade. Selecione quais tarefas abaixo merecem lembrete agora.

Critérios de seleção (selecione se qualquer um for verdadeiro):
- horas_desde_ultimo_lembrete é null (nunca foi lembrado)
- horas_desde_ultimo_lembrete > 6 e urgencia é "critica" ou "alta"
- horas_desde_ultimo_lembrete > 24 e urgencia é "media"
- horas_desde_ultimo_lembrete > 72 e urgencia é "baixa"
- dias_sem_interacao > 3

Máximo 5 tarefas. Prefira urgência maior.

Tarefas:
{json.dumps(tasks_context, ensure_ascii=False, indent=2)}

Responda APENAS com JSON array, sem texto adicional, sem markdown:
[{{"task_id": "id aqui", "motivo": "motivo curto"}}]

Exemplo de resposta válida:
[{{"task_id": "abc-123", "motivo": "4 dias sem interação"}}]

Se nenhuma se qualifica, responda: []"""

    try:
        log.info(f"Ollama: enviando prompt com {len(tasks_context)} tarefas...")
        raw = await _generate(prompt)
        log.info(f"Ollama raw response: {raw[:300]}")
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if not match:
            log.warning(f"Ollama: JSON array não encontrado na resposta")
            return []
        result = json.loads(match.group())
        log.info(f"Ollama selecionou {len(result)} tarefa(s) para lembrete")
        return result
    except Exception as e:
        log.error(f"Ollama decide_reminders error: {repr(e)}")
        return []


async def is_available() -> bool:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            return r.status_code == 200
    except Exception:
        return False
