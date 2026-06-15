# TaskMind — Backend

API REST assíncrona para o TaskMind. Recebe tarefas em linguagem natural, persiste no banco, e dispara lembretes proativos via Telegram com decisão de IA local.

---

## Stack

- **Python 3.12** + **FastAPI** — API REST com docs Swagger automáticas
- **SQLAlchemy 2.0 async** + **asyncpg** — ORM assíncrono para PostgreSQL
- **Alembic** — migrations versionadas
- **Neon DB** — PostgreSQL serverless (pode ser qualquer PostgreSQL)
- **APScheduler** — proatividade a cada 15min + resumo diário às 8h
- **Gemini 2.5-flash** — parsing de linguagem natural, inferência de urgência, NLP do Telegram
- **Ollama qwen2.5:3b** — decide quais tarefas merecem lembrete (roda local, sem custo)
- **httpx** — cliente HTTP assíncrono para Gemini e Ollama
- **python-telegram-bot / httpx polling** — bot bidirecional

---

## Estrutura

```
app/
├── main.py               # FastAPI app + lifespan (scheduler + telegram polling)
├── config.py             # Settings via pydantic-settings (.env)
├── db.py                 # Engine async + SessionLocal + Base
├── models/
│   └── task.py           # ORM: Task, Interaction, AiContext, Notification
├── schemas/
│   └── task.py           # Pydantic: TaskOut, TaskCreate, TaskUpdate, TaskIngest
├── routers/
│   └── tasks.py          # Endpoints REST
└── services/
    ├── ai_service.py     # Gemini: parse texto → TaskCreate estruturada
    ├── ollama_service.py # Ollama: decide quais tarefas notificar
    ├── scheduler_service.py  # APScheduler: proactivity_check + daily_summary
    ├── task_service.py   # CRUD de tarefas + comentários
    └── telegram_service.py   # Bot polling: /tasks, /nova, NLP bidirecional
alembic/
├── versions/             # Migrations versionadas
└── env.py
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env`:

```env
# Obrigatório
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname

# Gemini (parsing NL + Telegram NLP)
GEMINI_API_KEY=sua_chave_aqui

# Telegram (notificações + bot bidirecional)
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# Ollama (motor proativo — padrão: host local)
OLLAMA_BASE_URL=http://172.17.0.1:11434   # dentro do Docker: IP bridge do host
OLLAMA_MODEL=qwen2.5:3b
```

> **Nota:** `OLLAMA_BASE_URL` usa o IP do Docker bridge (`172.17.0.1`) para alcançar o Ollama rodando no host quando a API está em container.

---

## Desenvolvimento Local

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
cp .env.example .env           # preencha as variáveis

# Rodar migrations
alembic upgrade head

# Iniciar API
uvicorn app.main:app --reload --port 8000
```

Swagger disponível em `http://localhost:8000/docs`

---

## Docker

```bash
# Build
docker build -t taskmind-api .

# Run
docker run -d \
  --name taskmind-api \
  -p 8000:8000 \
  --env-file .env \
  taskmind-api
```

Imagem pública: `ygarciia/taskmind-api:latest`

```bash
docker pull ygarciia/taskmind-api:latest
docker run -d --name taskmind-api -p 8000:8000 --env-file .env ygarciia/taskmind-api:latest
```

As migrations rodam automaticamente no startup via `alembic upgrade head`.

---

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/tasks` | Lista tarefas (query: `status`, `urgencia`, `projeto`) |
| `POST` | `/api/tasks` | Cria tarefa estruturada (campos explícitos) |
| `POST` | `/api/tasks/ingest` | Cria tarefa via texto em linguagem natural |
| `GET` | `/api/tasks/{id}` | Detalhe de tarefa com histórico de interações |
| `PATCH` | `/api/tasks/{id}` | Atualiza campos (status, urgencia, titulo, etc.) |
| `POST` | `/api/tasks/{id}/complete` | Marca como concluída |
| `POST` | `/api/tasks/{id}/comment` | Adiciona comentário |
| `GET` | `/api/health` | Health check (`{"status": "ok", "version": "0.2.0"}`) |

### Exemplo — ingest

```bash
curl -X POST http://localhost:8000/api/tasks/ingest \
  -H "Content-Type: application/json" \
  -d '{"texto": "preciso revisar o contrato do cliente Y antes da reunião de sexta"}'
```

Resposta:
```json
{
  "task": {
    "id": "uuid...",
    "titulo": "Revisar contrato do cliente Y",
    "urgencia": "alta",
    "status": "aberta",
    "projeto": "Cliente Y",
    "tags": ["contrato", "reunião"],
    "prazo_inf": "2026-06-20T00:00:00Z"
  },
  "ai_raw": "{...json bruto do Gemini...}"
}
```

---

## Banco de Dados

Quatro tabelas gerenciadas via Alembic:

| Tabela | Descrição |
|--------|-----------|
| `tasks` | Tarefas principais com metadados de IA |
| `interactions` | Comentários, mudanças de status, lembretes enviados |
| `ai_context` | Prompts e respostas brutas dos modelos |
| `notifications` | Histórico de notificações enviadas |

**Status válidos:** `aberta` · `em_progresso` · `aguardando` · `revisando` · `concluida`  
**Urgências válidas:** `baixa` · `media` · `alta` · `critica`

---

## Motor de Proatividade

O scheduler roda duas rotinas:

**`proactivity_check`** — a cada 15 minutos (silêncio noturno: 23h–8h BRT)

1. Busca tarefas abertas com campo `pressao=True`
2. Filtra em Python por cooldown por urgência:
   - `critica` → 2h · `alta` → 6h · `media` → 24h · `baixa` → 72h
3. Envia tarefas elegíveis para Ollama decidir quais notificar (máx. 5)
4. Dispara mensagem no Telegram com contexto
5. Atualiza `ultimo_lembrete_em` na tarefa

**`daily_summary`** — todo dia às 8h BRT  
Envia resumo das tarefas abertas mais urgentes.

---

## Telegram Bot

O polling inicia automaticamente junto com a API (via `lifespan`).

| Entrada | Comportamento |
|---------|---------------|
| `/tasks` | Lista tarefas abertas ordenadas por urgência |
| `/nova <texto>` | Cria tarefa via Gemini (mesmo fluxo do `/ingest`) |
| Texto livre | Gemini interpreta e atualiza status/comentário da última tarefa notificada |

---

## Build e Push (Docker Hub)

```bash
docker build -t ygarciia/taskmind-api:latest .
docker push ygarciia/taskmind-api:latest
```
