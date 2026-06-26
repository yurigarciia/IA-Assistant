# TaskMind — Plano de Desenvolvimento

> Planejamento detalhado de marcos, fases e etapas  
> Baseado em: [PROJECT.md](./PROJECT.md)  
> Última atualização: 2026-06-15

---

## Status Geral

```
FASE 1 — Fundação         [x] Completa e em produção
TRAY APP                  [x] .exe distribuível com modal redesenhado (2026-06-15)
FASE 2 — IA e Input       [x] Completa e em produção (Gemini 2.5-flash)
FASE 3 — Proatividade     [x] Completa e em produção (2026-06-15, testado end-to-end)
FASE 4 — Canais e Bots    [x] Completa — Telegram + PWA concluídos (Teams postergado)
FASE 5 — Refinamento      [x] Documentação entregue (README + PROJECT.md atualizados)
EXPANSÃO — Notif Windows  [x] Toast nativa via tray app + polling 30s (2026-06-26)
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
- [x] Copiar `.env.example` → `.env` no servidor e preencher credenciais reais
- [x] Rodar backend e frontend via Docker + Portainer (containers gerenciados)
- [x] Nginx configurado como proxy reverso
- [x] Acesso via IP da VPN funcionando

### 1.2 — Banco de Dados

> O banco PostgreSQL já está rodando no servidor. Basta conectar e criar as tabelas do TaskMind.

- [x] Confirmar credenciais de acesso e string de conexão (`DATABASE_URL`)
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
- [x] Rodar migration inicial no servidor (automático via entrypoint.sh no container)
- [x] Validar conexão do backend com o banco via `.env`

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
- [x] Validar Swagger em `/docs` após subir no servidor (disponível por padrão no FastAPI)

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
- [x] Testes de parsing com exemplos variados (validado em uso real)

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
- [x] Build em `.exe` com PyInstaller — `.env` embutido no executável (arquivo único, sem dependências externas)
- [x] Modal redesenhado: estilo Spotlight, cantos arredondados nativos (DWM API), barra de progresso animada, foco imediato

**Marco 2 atingido quando:** atalho de teclado abre o modal, texto é enviado, IA processa e tarefa aparece estruturada na web. ✓ **CONCLUÍDO — .exe distribuível gerado em 2026-06-15**

---

## FASE 3 — Proatividade

**Objetivo:** O sistema identificar tarefas esquecidas e enviar lembretes sem intervenção do usuário.  
**Critério de conclusão:** Uma tarefa criada há 3 dias sem interação gerar uma notificação automática.

### 3.1 — Setup do Ollama

- [x] Ollama instalado no servidor como serviço systemd
- [x] Modelo `qwen2.5:7b` (4.7GB) rodando em `0.0.0.0:11434`
- [x] Criar cliente Ollama no backend (`ollama_service.py`) com `is_available()` e `decide_reminders()`
- [x] Acessível pelo Docker via `172.17.0.1:11434` (bridge gateway)

### 3.2 — Motor de Proatividade

- [x] Configurar APScheduler integrado ao FastAPI (lifespan)
- [x] Implementar `scheduler_service.py` com jobs:

  | Job | Frequência | Descrição |
  |---|---|---|
  | `proactivity_check` | A cada 15min | Ollama decide quais tarefas lembrar |
  | `daily_summary` | Todo dia 08h | Resumo do dia enviado via Telegram |

- [x] Implementar lógica de pressão crescente:
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
- [x] Prompt para o Ollama decidir quais tarefas lembrar:
  ```
  Você é um assistente de produtividade. Analise estas tarefas abertas
  e indique quais merecem um lembrete AGORA. Seja criterioso — não
  sobrecarregue o usuário. Retorne JSON com: [{"id": ..., "motivo": ...}]
  ```
- [x] Registrar cada notificação enviada na tabela `notifications`
- [x] Evitar lembrete duplicado via campo `ultimo_lembrete_em` + cooldown por urgência
- [x] `telegram_service.py`: envio + polling bidirecional + parse de respostas via Gemini
- [x] Entrypoint do Docker roda migrations automaticamente antes de subir a API
- [x] Health check no startup: valida Ollama, Gemini e Telegram nos logs

**Marco 3 atingido quando:** scheduler roda, consulta Ollama, e gera notificações para tarefas esquecidas. ✓ **CONCLUÍDO em 2026-06-15**

> **Testado end-to-end em 2026-06-15:** Ollama (qwen2.5:3b) selecionou tarefa TCC → notificação enviada via Telegram → usuário respondeu em linguagem natural → Gemini (2.5-flash) identificou ação e atualizou status no banco → confirmação enviada de volta pelo bot.

---

## FASE 4 — Canais e Bots

**Objetivo:** Notificações e input funcionando via Telegram e Teams.  
**Critério de conclusão:** Receber um lembrete no Telegram com botões, responder "feito" e ver a tarefa concluída no dashboard.

### 4.1 — Telegram Bot

- [x] Bot criado e configurado (token + chat_id)
- [x] Polling bidirecional via httpx (sem webhook — IP não público fora da VPN)
- [x] Envio de lembretes proativos com formato Markdown
- [x] Receber resposta em linguagem natural → Gemini identifica tarefa e ação → atualiza banco
- [x] Testado end-to-end em 2026-06-15
- [x] Comando `/tasks` — listar tarefas abertas ordenadas por urgência
- [x] Comando `/nova <texto>` — criar tarefa via bot (texto livre → Gemini ingest)
- [x] Silêncio noturno: proactivity_check bloqueado entre 23h e 8h (horário Brasília)
- [x] Pré-filtro de cooldown em Python antes do Ollama (evita spam a cada 15min)

### 4.2 — Microsoft Teams _(melhoria futura — fora do escopo atual)_

> Requer Azure AD, registro de app e infraestrutura pública. Postergado.

### 4.3 — PWA (Mobile)

- [x] Configurar `next-pwa` (@ducanh2912/next-pwa) no Next.js
- [x] Criar `manifest.json` (nome, ícone roxo, tema #7c6af7)
- [x] Ícones 192x512 gerados via Pillow + favicon SVG
- [x] Instalação como app testada no Android via Chrome
- [x] Layout mobile dedicado (< 768px): tab bar de status + lista por seções
- [x] MobileTaskCard com botão Mover (bottom sheet) e Comentar inline
- [x] Header compacto no mobile

**Marco 4 atingido quando:** lembrete chega no Telegram, usuário responde e status atualiza no dashboard. ✓ **CONCLUÍDO em 2026-06-15** (Teams postergado)

---

## FASE 5 — Refinamento

**Objetivo:** Sistema polido, estável e com funcionalidades de apoio para uso diário real.

### 5.1 — Funcionalidades de UX

- [x] Drag-and-drop para mover tarefas entre colunas do kanban
- [x] Filtros por urgência e busca por texto/projeto/tag
- [x] Kanban com 5 status (aberta, em_progresso, aguardando, revisando, concluída)
- [ ] Agrupamento por projeto (view alternativa) _(melhoria futura)_
- [ ] Modo escuro / claro _(melhoria futura)_
- [ ] Animações de conclusão de tarefa _(melhoria futura)_

### 5.2 — Resumos com IA

- [x] Resumo diário automático (08h) via Telegram — implementado em `daily_summary()`
- [ ] Resumo semanal (segunda-feira) _(melhoria futura)_
- [ ] Endpoint `GET /api/tasks/summary` com resumo em texto gerado pela IA _(melhoria futura)_

### 5.3 — Estabilidade e Operação

- [ ] Logs estruturados no backend (JSON, com request ID) _(melhoria futura)_
- [x] Health check no startup: valida Ollama, Gemini e Telegram nos logs
- [ ] Script de backup automático do PostgreSQL _(melhoria futura)_
- [x] Variáveis sensíveis em `.env` (nunca commitadas — `.gitignore` configurado)
- [x] README.md com instruções de instalação e uso
- [ ] Testes de integração para os endpoints principais _(melhoria futura)_

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
| Modelo Ollama padrão | llama3.2 / mistral / qwen2.5 | **qwen2.5:3b** (definido — 3b suficiente para seleção de lembretes) |
| Modal do Tray App | tkinter / webview / HTML local | **tkinter** (definido e implementado) |
| Autenticação | Sem auth (uso pessoal) / JWT simples | **Sem auth** (uso pessoal) |
| Atalho global Tray | Ctrl+Shift+T / outro | **Ctrl+Shift+T** (configurável via .env) |

---

## Checklist de Entrega (Laboratório de Inovação)

- [ ] Documentação (`PROJECT.md`) completa
- [x] Plano de desenvolvimento (`PLAN.md`) completo e atualizado
- [ ] Sistema rodando (demo ao vivo ou vídeo)
- [x] Pelo menos 2 canais de input funcionando (Tray App + Telegram `/nova`)
- [x] IA processando linguagem natural (Gemini ingest + Gemini reply parsing)
- [x] Proatividade demonstrável (lembrete automático via Ollama + Telegram)
- [x] Código no repositório git organizado
