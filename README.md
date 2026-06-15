# TaskMind

Gestor de tarefas pessoal com IA proativa. Auto-hospedado, multi-dispositivo, com captura em linguagem natural, kanban visual e notificações inteligentes via Telegram.

---

## Visão Geral

O TaskMind resolve o problema de gerenciar tarefas em múltiplos contextos sem fricção. Você digita "terminar relatório do cliente X antes da reunião" e o sistema infere urgência, prazo e projeto automaticamente. Sem configurar regras — a IA cuida disso.

**Pontos de entrada:**
- **Windows Tray App** — modal Spotlight-style abre com `Ctrl+Shift+T`, tarefa criada em segundos
- **Web / PWA** — dashboard kanban acessível de qualquer dispositivo via VPN, instalável no celular
- **Telegram** — `/nova <texto>` para criar, `/tasks` para listar, respostas em NL para atualizar status

**Motor proativo:**  
A cada 15 minutos (8h–23h, fuso Brasília) o sistema analisa tarefas abertas e envia lembretes contextuais via Telegram para tarefas esquecidas — sem você precisar definir lembretes.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  DISPOSITIVOS DO USUÁRIO                │
│  Windows Tray App │ Browser / PWA │ Telegram (celular) │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS via VPN
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVIDOR DOMÉSTICO                   │
│                                                         │
│   FastAPI (porta 8000)       Next.js PWA (porta 3010)  │
│       │                                                 │
│       ├── Neon DB (PostgreSQL serverless)               │
│       ├── APScheduler (proatividade a cada 15min)       │
│       ├── Gemini 2.5-flash (parsing NL, Telegram NLP)  │
│       └── Ollama qwen2.5:3b (decisão de lembretes)     │
└─────────────────────────────────────────────────────────┘
```

**Distribuição de IA:**

| Tarefa | Modelo |
|--------|--------|
| Parsing de linguagem natural (input) | Gemini 2.5-flash |
| Interpretação de respostas Telegram | Gemini 2.5-flash |
| Decisão de quais tarefas lembrar | Ollama qwen2.5:3b (local) |

---

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy async + asyncpg, APScheduler, httpx
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, @dnd-kit/core, SWR, @ducanh2912/next-pwa
- **Banco:** Neon DB (PostgreSQL serverless)
- **IA:** Gemini 2.5-flash API + Ollama (local, qwen2.5:3b)
- **Infra:** Docker, Portainer, Tailscale VPN
- **Tray App:** Python, pystray, tkinter, PyInstaller

---

## Pré-requisitos

- Docker + Docker Compose (no servidor)
- Conta Neon DB (ou PostgreSQL próprio)
- Chave API Google Gemini
- Ollama rodando com `qwen2.5:3b` (`ollama pull qwen2.5:3b`)
- Bot Telegram criado via @BotFather
- Tailscale (ou VPN equivalente) para acesso remoto seguro

---

## Instalação

### 1. Variáveis de ambiente

Copie o exemplo e preencha:

```bash
cp taskmind/backend/.env.example taskmind/backend/.env
```

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
GEMINI_API_KEY=sua_chave_aqui
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
OLLAMA_URL=http://172.17.0.1:11434   # IP do Docker bridge para o host
```

### 2. Backend

```bash
cd taskmind/backend
docker build -t taskmind-api .
docker run -d --name taskmind-api -p 8000:8000 --env-file .env taskmind-api
```

Ou via Docker Hub:

```bash
docker pull ygarciia/taskmind-api:latest
docker run -d --name taskmind-api -p 8000:8000 --env-file .env ygarciia/taskmind-api:latest
```

As migrations rodam automaticamente na inicialização (Alembic).

### 3. Frontend

```bash
cd taskmind/frontend
docker build -t taskmind-frontend .
docker run -d --name taskmind-frontend -p 3010:3000 taskmind-frontend
```

Ou via Docker Hub:

```bash
docker pull ygarciia/taskmind-frontend:latest
docker run -d --name taskmind-frontend -p 3010:3000 ygarciia/taskmind-frontend:latest
```

Acesse: `http://SEU_IP_VPN:3010`

### 4. Tray App (Windows)

**Opção A — usar o .exe pré-compilado:**

Baixe o `TaskMind.exe` da pasta `taskmind/tray-app/dist/` e execute. O `.env` está embutido no executável.

**Opção B — compilar do código-fonte:**

```bash
cd taskmind/tray-app
cp .env.example .env
# edite .env com API_URL e DASHBOARD_URL
build.bat
```

O executável gerado em `dist/TaskMind.exe` não precisa de dependências externas.

**Variáveis do tray app (embutidas no .exe):**

```env
API_URL=http://SEU_IP_VPN:8000
DASHBOARD_URL=http://SEU_IP_VPN:3010
HOTKEY=ctrl+shift+t
```

---

## Uso

### Web / PWA

Acesse `http://SEU_IP_VPN:3010` no browser. No celular, use "Adicionar à tela inicial" para instalar como PWA.

O dashboard mostra um **kanban** com 5 colunas (Aberta → Em Progresso → Aguardando → Revisando → Concluída) com drag & drop. No celular, o layout muda para uma lista com abas por status.

### Tray App

- `Ctrl+Shift+T` abre o modal de nova tarefa
- Digite em linguagem natural: `"revisar proposta do cliente Y até sexta"`
- `Enter` envia — barra de progresso anima enquanto a IA processa
- Verde = sucesso, vermelho = erro

Clique com botão direito no ícone para abrir o dashboard ou sair.

### Telegram

| Comando / Mensagem | Ação |
|--------------------|------|
| `/tasks` | Lista tarefas abertas, ordenadas por urgência |
| `/nova <texto>` | Cria nova tarefa em linguagem natural |
| Resposta em texto livre | IA interpreta e atualiza status/comentário da última tarefa notificada |

**Exemplo de resposta bidirecional:**
```
[Bot] Ei! A tarefa "Revisar contrato cliente Y" está aberta há 4 dias.
[Você] já terminei isso
[Bot] ✅ Marcada como concluída!
```

### API

Documentação interativa disponível em `http://SEU_IP_VPN:8000/docs`

Endpoints principais:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/tasks` | GET | Lista tarefas (filtros: status, urgencia, busca) |
| `/tasks/ingest` | POST | Cria tarefa via linguagem natural |
| `/tasks/{id}` | GET | Detalhe de uma tarefa |
| `/tasks/{id}` | PATCH | Atualiza campos (status, urgencia, comentário) |
| `/tasks/{id}` | DELETE | Remove tarefa |

---

## Motor de Proatividade

O scheduler roda a cada 15 minutos entre **8h e 23h (horário de Brasília)**.

**Fluxo:**

1. Busca tarefas abertas com interação pendente
2. Filtra em Python por cooldown (critica=2h, alta=6h, media=24h, baixa=72h)
3. Envia tarefas elegíveis para Ollama (qwen2.5:3b) decidir quais notificar
4. Dispara mensagem no Telegram com contexto
5. Atualiza `ultimo_lembrete_em` na tarefa

Além da proatividade, um **resumo diário** é enviado às 8h com as tarefas abertas mais urgentes.

---

## Status de Tarefas

```
aberta → em_progresso → aguardando → revisando → concluida
```

Qualquer transição é válida. A IA pode mover o status via resposta no Telegram.

---

## Desenvolvimento Local

### Backend

```bash
cd taskmind/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # preencha as variáveis
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd taskmind/frontend
npm install
# crie .env.local com NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                   # porta 3000
```

### Tray App

```bash
cd taskmind/tray-app
pip install -r requirements.txt
cp .env.example .env          # preencha as variáveis
python main.py
```

---

## Deploy (Docker Hub + Portainer)

Os builds são publicados automaticamente:

```bash
# Backend
cd taskmind/backend
docker build -t ygarciia/taskmind-api:latest .
docker push ygarciia/taskmind-api:latest

# Frontend
cd taskmind/frontend
docker build -t ygarciia/taskmind-frontend:latest .
docker push ygarciia/taskmind-frontend:latest
```

No Portainer, atualize o container com a nova imagem.

---

## Estrutura do Projeto

```
taskmind/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan (scheduler + telegram)
│   │   ├── db.py                # Engine SQLAlchemy + session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # Endpoints REST
│   │   └── services/
│   │       ├── ai_service.py    # Gemini: parsing NL → task estruturada
│   │       ├── ollama_service.py# Ollama: decisão de quais tarefas notificar
│   │       ├── scheduler_service.py  # APScheduler: proatividade + resumo diário
│   │       ├── task_service.py  # CRUD de tarefas
│   │       └── telegram_service.py   # Bot: polling, comandos, NLP bidirecional
│   ├── alembic/                 # Migrations
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   ├── components/
│   │   │   ├── KanbanBoard.tsx  # Kanban com drag & drop (desktop)
│   │   │   └── mobile/
│   │   │       ├── MobileLayout.tsx     # Layout mobile com abas
│   │   │       ├── MobileTaskCard.tsx   # Card mobile com ações
│   │   │       └── MobileStatusSheet.tsx# Bottom sheet de status
│   │   ├── hooks/
│   │   │   └── useIsMobile.ts   # Detecção de breakpoint 768px
│   │   └── lib/
│   │       └── api.ts           # Funções de chamada à API
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   ├── favicon.svg
│   │   └── icons/               # Ícones PWA (192px, 512px)
│   └── next.config.js           # PWA config (@ducanh2912/next-pwa)
│
├── tray-app/
│   ├── main.py                  # pystray: tray icon + hotkey + menu
│   ├── modal.py                 # tkinter modal Spotlight-style + DWM rounded corners
│   ├── config.py                # .env loader (sys._MEIPASS para .exe)
│   ├── taskmind.spec            # PyInstaller spec
│   ├── build.bat                # Script de build do .exe
│   ├── requirements.txt
│   └── .env.example
│
└── docs/
    ├── PLAN.md                  # Roadmap e progresso do projeto
    └── PROJECT.md               # Documento de concepção (Laboratório de Inovação)
```
