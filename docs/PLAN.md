# TaskMind — Plano de Desenvolvimento

> Planejamento detalhado de marcos, fases e etapas  
> Baseado em: [PROJECT.md](./PROJECT.md)  
> Última atualização: 2026-06-08 (rev: sem Docker Compose, banco externo já existente)

---

## Status Geral

```
FASE 1 — Fundação         [x] Completa e em produção
FASE 2 — IA e Input       [x] Completa e em produção (Gemini 2.0-flash)
FASE 3 — Proatividade     [ ] Próxima
FASE 4 — Canais e Bots    [ ] Pendente
FASE 5 — Refinamento      [~] Parcial (drag & drop, busca, filtros, kanban já feitos)
```

---

## Visão dos Marcos

```
Semana 1-2      Semana 3-4      Semana 5-6      Semana 7-8      Semana 9-10
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
[MARCO 1]       [MARCO 2]       [MARCO 3]       [MARCO 4]       [MARCO 5]
Infra + API     IA + Tray       Proatividade    Bots + PWA      Polish
funcionando     funcionando     ativa           integrados      final
```

---

## FASE 1 — Fundação

**Objetivo:** Ter a espinha dorsal do sistema rodando no servidor com API funcional e frontend básico.  
**Critério de conclusão:** Conseguir criar, listar e atualizar uma tarefa via browser, com dados persistidos no banco.

### 1.1 — Infraestrutura (Servidor)

- [x] Criar estrutura de pastas do projeto
  ```
  taskmind/
  ├── backend/
  ├── frontend/
  └── tray-app/
  ```
- [x] Configurar variáveis de ambiente (`.env.example` criado com todas as variáveis)
  - `DATABASE_URL` apontando para o banco já existente no servidor
  - Demais segredos (Gemini API key, Telegram token, etc.)
- [ ] Copiar `.env.example` → `.env` no servidor e preencher credenciais reais
- [ ] Rodar backend e frontend como processos diretos no servidor (ex: `uvicorn` + `pm2` ou scripts de serviço)
- [ ] Configurar Nginx como proxy reverso (se já não estiver configurado)
  - `/` → frontend (porta 3000)
  - `/api` → backend (porta 8000)
- [ ] Verificar acesso via IP da VPN

### 1.2 — Banco de Dados

> O banco PostgreSQL já está rodando no servidor. Basta conectar e criar as tabelas do TaskMind.

- [ ] Confirmar credenciais de acesso e string de conexão (`DATABASE_URL`)
- [x] Criar as tabelas do TaskMind via migration (Alembic — migration `0001_initial.py` pronta):

  ```sql
  -- Tarefas
  CREATE TABLE tasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo        TEXT NOT NULL,
    descricao     TEXT,
    urgencia      VARCHAR(10) DEFAULT 'media',   -- baixa, media, alta, critica
    status        VARCHAR(20) DEFAULT 'aberta',  -- aberta, em_andamento, concluida, arquivada
    projeto       TEXT,
    tags          TEXT[],
    prazo_inf     TIMESTAMPTZ,
    pressao       BOOLEAN DEFAULT true,
    criada_em     TIMESTAMPTZ DEFAULT NOW(),
    atualizada_em TIMESTAMPTZ DEFAULT NOW(),
    concluida_em  TIMESTAMPTZ
  );

  -- Interações (comentários, histórico de status)
  CREATE TABLE interactions (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id   UUID REFERENCES tasks(id) ON DELETE CASCADE,
    tipo      VARCHAR(20),  -- comentario, status_change, lembrete_enviado
    conteudo  TEXT,
    criada_em TIMESTAMPTZ DEFAULT NOW()
  );

  -- Contexto gerado pela IA
  CREATE TABLE ai_context (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id   UUID REFERENCES tasks(id) ON DELETE CASCADE,
    modelo    TEXT,
    prompt    TEXT,
    resposta  TEXT,
    criada_em TIMESTAMPTZ DEFAULT NOW()
  );

  -- Notificações enviadas
  CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    UUID REFERENCES tasks(id),
    canal      VARCHAR(20),  -- telegram, teams, desktop
    mensagem   TEXT,
    enviada_em TIMESTAMPTZ DEFAULT NOW(),
    respondida BOOLEAN DEFAULT false
  );
  ```

- [x] Configurar Alembic para migrations (versionamento de schema)
- [ ] Rodar migration inicial no servidor (`alembic upgrade head`)
- [ ] Validar conexão do backend com o banco via `.env`

### 1.3 — Backend (FastAPI)

- [x] Inicializar projeto FastAPI com estrutura de módulos:
  ```
  backend/app/
  ├── main.py         — app FastAPI + CORS + routers
  ├── config.py       — Settings via pydantic-settings
  ├── db.py           — engine async + session + Base
  ├── models/         — SQLAlchemy (Task, Interaction, AiContext, Notification)
  ├── schemas/        — Pydantic (TaskOut, TaskCreate, TaskUpdate, IngestResult...)
  ├── routers/        — tasks.py
  └── services/       — task_service.py, ai_service.py (Gemini + fallback)
  ```
- [x] Implementar todos os endpoints:
  - `GET  /api/tasks` — listar com filtros (status, urgência, projeto)
  - `POST /api/tasks` — criar tarefa estruturada
  - `POST /api/tasks/ingest` — criar via linguagem natural (Gemini)
  - `GET  /api/tasks/{id}` — detalhe
  - `PATCH /api/tasks/{id}` — atualizar
  - `POST /api/tasks/{id}/complete` — concluir
  - `POST /api/tasks/{id}/comment` — comentar
  - `GET  /api/health` — health check
- [x] Configurar CORS
- [ ] Validar Swagger em `/docs` após subir no servidor

### 1.4 — Frontend (Next.js)

- [x] Inicializar projeto Next.js 14 com TypeScript e Tailwind
- [x] Página principal com listagem de tarefas agrupadas por urgência (4 seções com cores)
- [x] TaskCard com ações: concluir (✓) e comentar (💬)
- [x] Modal de nova tarefa com input de texto livre
- [x] Integração com a API via SWR (auto-refresh a cada 10s)
- [x] Estados de loading e empty state

**Marco 1 atingido quando:** criar uma tarefa pelo browser e ver ela listada, com dados no PostgreSQL. ✓

---

## FASE 2 — IA e Input

**Objetivo:** Transformar texto livre em tarefa estruturada via IA, e ter o tray app funcionando no Windows.  
**Critério de conclusão:** Digitar "preciso revisar o contrato do cliente X" no tray app e a tarefa aparecer com urgência e projeto inferidos.

### 2.1 — Integração com Gemini API

- [x] Configurar cliente Gemini no backend (`google-generativeai`)
- [x] Criar serviço `ai_service.py` com função `parse_task(texto: str) -> TaskSchema`
- [x] Prompt de sistema para extração de entidades (título, urgência, projeto, prazo, tags)
- [x] Endpoint `POST /api/tasks/ingest` implementado
- [x] Fallback: se Gemini falhar ou key não configurada, salva com urgência "media"
- [ ] Testes de parsing com exemplos variados (validar em uso real)

### 2.2 — Windows Tray App

- [x] Inicializar projeto Python (`tray-app/`)
  ```
  tray-app/
  ├── main.py         — entry point + tray icon + hotkey
  ├── modal.py        — janela tkinter sem borda
  ├── api_client.py   — ingest_task + health_check
  ├── config.py       — API_URL e HOTKEY via .env
  ├── install.bat     — instalação de dependências
  └── .env.example
  ```
- [x] Ícone na bandeja gerado via Pillow (sem arquivo externo)
  - Muda de cor (roxo = online, cinza = offline)
  - Ping a cada 30s para verificar servidor
  - Menu: "Nova tarefa", "Abrir dashboard", "Iniciar com Windows", "Sair"
- [x] Modal de captura tkinter
  - Janela sem borda, sempre no topo, centralizada
  - Enter ou Ctrl+Enter para salvar
  - Esc para fechar
  - Feedback visual: "Enviando..." → "✓ Salvo: título" ou "✗ Sem conexão"
  - Fecha automaticamente após sucesso
- [x] Atalho global `Ctrl+Shift+T` (configurável no `.env`)
- [x] Startup do Windows via registro (`HKCU\...\Run`) — toggle no menu do ícone
- [ ] Build em `.exe` com PyInstaller (opcional — para instalar sem Python)

**Marco 2 atingido quando:** atalho de teclado abre o modal, texto é enviado, IA processa e tarefa aparece estruturada na web. ✓

---

## FASE 3 — Proatividade

**Objetivo:** O sistema identificar tarefas esquecidas e enviar lembretes sem intervenção do usuário.  
**Critério de conclusão:** Uma tarefa criada há 3 dias sem interação gerar uma notificação automática.

### 3.1 — Setup do Ollama

- [ ] Adicionar serviço `ollama` ao `docker-compose.yml`
- [ ] Baixar modelo base (ex: `llama3.2` ou `mistral`)
- [ ] Criar cliente Ollama no backend (`ollama_client.py`)
- [ ] Teste de chamada: perguntar ao modelo sobre uma tarefa mock
- [ ] Definir qual modelo usar para qual tarefa (routing Gemini vs Ollama)

### 3.2 — Motor de Proatividade

- [ ] Configurar APScheduler integrado ao FastAPI
- [ ] Implementar `scheduler_service.py` com jobs:

  | Job | Frequência | Descrição |
  |---|---|---|
  | `check_stale_tasks` | A cada 6h | Verifica tarefas sem interação |
  | `daily_summary` | Todo dia 08h | Resumo do dia enviado via bot |
  | `weekly_report` | Segunda 09h | Resumo semanal com IA |

- [ ] Implementar lógica de pressão crescente:
  ```python
  def calcular_pressao(task) -> str | None:
      dias = (now() - task.ultima_interacao).days
      if task.urgencia == "alta" and dias >= 1: return "lembrete_alto"
      if task.urgencia == "media" and dias >= 3: return "lembrete_medio"
      if task.urgencia == "baixa" and dias >= 7: return "lembrete_leve"
      if dias >= 14: return "lembrete_urgente"
      if dias >= 30: return "sugestao_arquivar"
      return None
  ```
- [ ] Prompt para o Ollama decidir quais tarefas lembrar:
  ```
  Você é um assistente de produtividade. Analise estas tarefas abertas
  e indique quais merecem um lembrete AGORA. Seja criterioso — não
  sobrecarregue o usuário. Retorne JSON com: [{"id": ..., "motivo": ...}]
  ```
- [ ] Registrar cada notificação enviada na tabela `notifications`
- [ ] Evitar lembrete duplicado (cooldown mínimo por tarefa)

**Marco 3 atingido quando:** scheduler roda, consulta Ollama, e gera notificações para tarefas esquecidas. ✓

---

## FASE 4 — Canais e Bots

**Objetivo:** Notificações e input funcionando via Telegram e Teams.  
**Critério de conclusão:** Receber um lembrete no Telegram com botões, responder "feito" e ver a tarefa concluída no dashboard.

### 4.1 — Telegram Bot

- [ ] Criar bot no BotFather e obter token
- [ ] Adicionar serviço `telegram-bot` ao `docker-compose.yml`
- [ ] Implementar handlers:
  - Mensagem de texto livre → `POST /api/tasks/ingest`
  - Comando `/tasks` → lista tarefas abertas
  - Callback de botões inline: Feito / Comentar / Adiar
- [ ] Implementar envio de lembretes com botões interativos (Inline Keyboard)
- [ ] Webhook: `POST /webhook/telegram` no FastAPI
- [ ] Testar fluxo completo: lembrete → resposta → atualização no banco

### 4.2 — Microsoft Teams

- [ ] Registrar app no Azure AD (App ID + Secret)
- [ ] Criar manifesto do Teams App (`manifest.json`):
  - Tab apontando para o frontend Next.js
  - Bot configurado com webhook endpoint
- [ ] Implementar handler Teams no FastAPI:
  - `POST /webhook/teams` — recebe mensagens e atividades
  - Responder a mensagens de texto com parsing via IA
  - Enviar Adaptive Cards para lembretes com botões
- [ ] Criar `Adaptive Card` template para notificações:
  ```json
  {
    "type": "AdaptiveCard",
    "body": [
      { "type": "TextBlock", "text": "🔔 Lembrete: {titulo}" },
      { "type": "TextBlock", "text": "Há {dias} dias sem interação" }
    ],
    "actions": [
      { "type": "Action.Submit", "title": "✅ Feito", "data": {"action": "complete"} },
      { "type": "Action.Submit", "title": "⏭ Adiar", "data": {"action": "snooze"} }
    ]
  }
  ```
- [ ] Adicionar endpoint `/webhook/teams` ao endpoint list da API
- [ ] Instalar app manualmente no Teams (sideload)
- [ ] Testar tab + bot no Teams

### 4.3 — PWA (Mobile)

- [ ] Configurar `next-pwa` no Next.js
- [ ] Criar `manifest.json` (nome, ícone, cores)
- [ ] Testar instalação como app no Android/iOS via browser
- [ ] Verificar responsividade do dashboard no celular

**Marco 4 atingido quando:** lembrete chega no Telegram E Teams, usuário responde por qualquer um dos dois, e o status atualiza no dashboard. ✓

---

## FASE 5 — Refinamento

**Objetivo:** Sistema polido, estável e com funcionalidades de apoio para uso diário real.

### 5.1 — Funcionalidades de UX

- [x] Drag-and-drop para mover tarefas entre colunas do kanban
- [x] Filtros por urgência e busca por texto/projeto/tag
- [x] Kanban com 5 status (aberta, em_progresso, aguardando, revisando, concluída)
- [ ] Agrupamento por projeto (view alternativa)
- [ ] Modo escuro / claro
- [ ] Animações de conclusão de tarefa

### 5.2 — Resumos com IA

- [ ] Resumo diário automático (08h) via Telegram/Teams:
  - "Bom dia! Você tem X tarefas abertas. As 3 mais urgentes são..."
- [ ] Resumo semanal (segunda-feira):
  - Tarefas concluídas na semana
  - Tarefas arrastadas sem resolução
  - Sugestão de foco da semana
- [ ] Endpoint `GET /api/tasks/summary` com resumo em texto gerado pela IA

### 5.3 — Estabilidade e Operação

- [ ] Logs estruturados no backend (JSON, com request ID)
- [ ] Health check endpoint com status dos serviços dependentes
- [ ] Script de backup automático do PostgreSQL
- [ ] Variáveis sensíveis em `.env` (nunca commitadas)
- [ ] Documentação de como rodar o projeto (`README.md`)
- [ ] Testes de integração para os endpoints principais

**Marco 5 atingido quando:** sistema em uso real diário por pelo menos 1 semana sem falhas críticas. ✓

---

## Dependências Entre Fases

```
FASE 1 (Infra + API + Frontend)
    │
    ├──────────────────┐
    ▼                  ▼
FASE 2              FASE 3
(IA + Tray)         (Proatividade)
    │                  │
    └──────┬───────────┘
           ▼
        FASE 4
    (Bots + PWA)
           │
           ▼
        FASE 5
      (Refinamento)
```

> Fases 2 e 3 podem ser desenvolvidas em paralelo após a Fase 1.

---

## Decisões Técnicas Abertas

| Decisão | Opções | Status |
|---|---|---|
| Modelo Ollama padrão | llama3.2 / mistral / qwen2.5 | A definir na Fase 3 |
| Modal do Tray App | tkinter / webview / HTML local | A definir na Fase 2 |
| Autenticação | Sem auth (uso pessoal) / JWT simples | A definir |
| Atalho global Tray | Ctrl+Shift+T / outro | A definir na Fase 2 |

---

## Checklist de Entrega (Laboratório de Inovação)

- [ ] Documentação (`PROJECT.md`) completa
- [ ] Plano de desenvolvimento (`PLAN.md`) completo
- [ ] Sistema rodando (demo ao vivo ou vídeo)
- [ ] Pelo menos 2 canais de input funcionando
- [ ] IA processando linguagem natural
- [ ] Proatividade demonstrável (lembrete automático)
- [ ] Código no repositório git organizado
