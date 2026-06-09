import json
import re
from app.schemas.task import TaskCreate
from app.config import settings

PARSE_PROMPT = """Você é um assistente de produtividade. Analise o texto abaixo e extraia as informações da tarefa.

Retorne SOMENTE um JSON válido com esta estrutura (sem markdown, sem explicações):
{
  "titulo": "título limpo e objetivo da tarefa",
  "descricao": "detalhes adicionais se houver, ou null",
  "urgencia": "baixa | media | alta | critica",
  "projeto": "nome do projeto ou cliente inferido, ou null",
  "tags": ["tag1", "tag2"],
  "prazo_inf": "ISO 8601 se mencionado, ou null"
}

Regras para urgência:
- critica: palavras como "urgente", "agora", "hoje", "antes da reunião", "prazo hoje"
- alta: contexto comercial com cliente, entrega próxima, "essa semana"
- media: tarefas de rotina sem prazo claro
- baixa: "algum dia", "quando der", "futuro"

Texto: {texto}"""


async def parse_task(texto: str) -> tuple[TaskCreate, dict | None]:
    if not settings.gemini_api_key:
        return _fallback(texto), None

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(PARSE_PROMPT.format(texto=texto))
        raw_text = response.text.strip()

        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not json_match:
            return _fallback(texto), None

        data = json.loads(json_match.group())
        task = TaskCreate(
            titulo=data.get("titulo", texto[:100]),
            descricao=data.get("descricao"),
            urgencia=data.get("urgencia", "media"),
            projeto=data.get("projeto"),
            tags=data.get("tags"),
            prazo_inf=data.get("prazo_inf"),
        )
        return task, data

    except Exception:
        return _fallback(texto), None


def _fallback(texto: str) -> TaskCreate:
    return TaskCreate(titulo=texto[:200], urgencia="media")
