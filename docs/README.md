# TaskMind — Documentação

Documentos de concepção, planejamento e arquitetura do projeto.

---

## Arquivos

### [PROJECT.md](./PROJECT.md)

Documento principal do projeto, produzido para o Laboratório de Inovação. Cobre:

- O problema e o contexto do usuário (por que WhatsApp e Notion falharam)
- Requisitos funcionais e não-funcionais
- Proposta de solução com princípios de design
- Arquitetura técnica com diagramas ASCII
- Fluxos principais (captura, proatividade, visualização)
- Stack completa e infraestrutura real (Tailscale, Docker, Neon DB)
- Módulos do sistema com endpoints e responsabilidades
- Comparativo com soluções existentes (Notion, Todoist)
- Roadmap com status de cada fase

### [PLAN.md](./PLAN.md)

Plano de desenvolvimento detalhado com rastreamento de progresso. Cobre:

- Status geral de cada fase (todas concluídas)
- Checklists granulares por etapa (infra, API, IA, tray, Telegram, PWA, mobile)
- Critérios de conclusão por marco
- Dependências entre fases
- Decisões técnicas tomadas durante o desenvolvimento
- Itens marcados como melhorias futuras (fora do escopo atual)

---

## Status do Projeto

```
FASE 1 — Fundação         [x] Completa e em produção
FASE 2 — IA e Input       [x] Completa e em produção
FASE 3 — Proatividade     [x] Completa e em produção
FASE 4 — Canais e Bots    [x] Completa (Telegram + PWA)
FASE 5 — Refinamento      [x] Documentação entregue
```

---

## Outros READMEs

| Módulo | Localização |
|--------|-------------|
| Visão geral do projeto | [README.md](../README.md) |
| Backend (FastAPI) | [taskmind/backend/README.md](../taskmind/backend/README.md) |
| Frontend (Next.js / PWA) | [taskmind/frontend/README.md](../taskmind/frontend/README.md) |
| Tray App (Windows .exe) | [taskmind/tray-app/README.md](../taskmind/tray-app/README.md) |
