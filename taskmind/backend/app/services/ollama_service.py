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

    prompt = f"""Você é um assistente de produtividade pessoal. Analise as tarefas abaixo e decida quais merecem um lembrete AGORA para o usuário.

Regras de frequência mínima entre lembretes:
- critica: enviar se passaram mais de 2h desde o último lembrete
- alta: enviar se passaram mais de 6h desde o último lembrete
- media: enviar se passaram mais de 24h desde o último lembrete
- baixa: enviar se passaram mais de 72h desde o último lembrete
- Se "horas_desde_ultimo_lembrete" for null, nunca foi lembrado — priorizar.
- Seja SELETIVO. Máximo 5 tarefas por vez. Não sobrecarregue o usuário.
- Tarefas com prazo próximo têm prioridade extra.

Tarefas:
{json.dumps(tasks_context, ensure_ascii=False, indent=2)}

Retorne SOMENTE um array JSON válido, sem markdown, sem explicações:
[{{"task_id": "uuid", "motivo": "razão curta em português"}}]

Se nenhuma tarefa merece lembrete agora, retorne exatamente: []"""

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
