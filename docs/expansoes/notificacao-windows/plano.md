# Plano de Implementação — Notificação Windows via Tray App

> Baseado em: `design.md`  
> Critérios de validação: `criterios-aceite.md`  
> Status: ✅ Concluída

---

## Visão das Rodadas

```
Rodada 1 — Backend: banco + endpoints
Rodada 2 — Backend: scheduler cria notif desktop
Rodada 3 — Tray App: notifier.py + api_client
Rodada 4 — Tray App: integração no ping_loop
Rodada 5 — Validação end-to-end + ajustes
```

---

## Rodada 1 — Backend: banco e endpoints

**Objetivo:** API capaz de criar, listar e confirmar notificações desktop.

- [x] Adicionar campo `entregue_tray: Mapped[bool]` no model `Notification` em `task.py`
- [x] Criar migration `0003_notif_entregue_tray.py` com `ALTER TABLE notifications ADD COLUMN entregue_tray BOOLEAN DEFAULT FALSE`
- [x] Criar `taskmind/backend/app/routers/notifications.py` com:
  - [x] `GET /api/notifications/pending` → filtra `canal="desktop"` e `entregue_tray=False`
  - [x] `POST /api/notifications/{id}/ack` → seta `entregue_tray=True`
- [x] Registrar o novo router em `main.py`
- [ ] Testar manualmente via Swagger (`/docs`):
  - [ ] Inserir registro de teste direto no banco e chamar `/pending`
  - [ ] Chamar `/ack` e confirmar que `entregue_tray` muda para `True`
  - [ ] Chamar `/pending` novamente e confirmar que não retorna o registro confirmado

**Critérios validados nesta rodada:** CA-NW04, CA-NW05

---

## Rodada 2 — Backend: scheduler cria notificação desktop

**Objetivo:** O motor proativo passa a registrar notificações para o canal desktop além do Telegram.

- [x] Em `scheduler_service.py`, após o bloco que envia via Telegram, adicionar criação de `Notification(canal="desktop", entregue_tray=False, mensagem=..., task_id=...)`
- [x] Garantir que a criação desktop não falha se Telegram não estiver configurado (canais independentes)
- [ ] Testar: forçar execução do `proactivity_check` e verificar no banco se registro `canal="desktop"` foi criado

**Critérios validados nesta rodada:** CA-NW07 (independência dos canais)

---

## Rodada 3 — Tray App: notifier.py e api_client

**Objetivo:** Tray app consegue buscar, exibir e confirmar notificações.

- [x] Adicionar `winotify==1.1.0` em `taskmind/tray-app/requirements.txt`
- [x] Criar `taskmind/tray-app/notifier.py`:
  - [x] Função `check_and_notify()` — busca pendentes, exibe toast, confirma via ack
  - [x] Toast com título `"TaskMind — Tarefa pendente"`, corpo com título + urgência da tarefa
  - [x] Ao clicar na toast: abre `DASHBOARD_URL` no browser
  - [x] Try/except em torno de tudo — falha silenciosa, sem derrubar o processo
- [x] Em `taskmind/tray-app/api_client.py`, adicionar:
  - [x] `get_pending_notifications() -> list[dict]`
  - [x] `ack_notification(notification_id: str) -> bool`
- [x] Testar `notifier.py` isoladamente (via endpoint `/api/notifications/test`)

**Critérios validados nesta rodada:** CA-NW01, CA-NW03

---

## Rodada 4 — Tray App: integração no ping_loop

**Objetivo:** Tray app verifica notificações automaticamente a cada 30s, sem intervenção manual.

- [x] Em `main.py`, dentro de `ping_loop()`, adicionar chamada a `notifier.check_and_notify()` quando `is_online=True`
- [x] Garantir que falha no notifier não interrompe o ping_loop (try/except)
- [x] Testar com tray app rodando: criar notificação no banco e aguardar até 30s

**Critérios validados nesta rodada:** CA-NW02 (sem duplicação), CA-NW06 (resiliente a offline)

---

## Rodada 5 — Validação end-to-end e ajustes

**Objetivo:** Confirmar todos os critérios de aceite com o fluxo completo real.

- [x] Build novo `.exe` com `winotify` incluído (`build.bat`)
- [x] Testar fluxo completo: notificação criada → toast no Windows → dashboard abre ao clicar ✅
- [x] Ajuste: `audio.Reminder` + `duration="long"` para aparecer no modo silencioso
- [x] Validar CAs conforme `criterios-aceite.md`
- [x] Atualizar `prompts.md` com os prompts usados durante a implementação
- [x] Atualizar `docs/PLAN.md` com a feature concluída
- [ ] Build e push da nova imagem Docker do backend (`ygarciia/taskmind-api`)
- [ ] Build novo `.exe` do tray app com `winotify` + ajuste de som
- [ ] Commit final

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `taskmind/backend/app/models/task.py` | ✏️ adicionar campo `entregue_tray` |
| `taskmind/backend/migrations/versions/0003_notif_tray.py` | 🆕 criar migration |
| `taskmind/backend/app/routers/notifications.py` | 🆕 criar router |
| `taskmind/backend/app/main.py` | ✏️ registrar novo router |
| `taskmind/backend/app/services/scheduler_service.py` | ✏️ criar notif desktop |
| `taskmind/tray-app/notifier.py` | 🆕 criar módulo de toast |
| `taskmind/tray-app/api_client.py` | ✏️ adicionar 2 funções |
| `taskmind/tray-app/main.py` | ✏️ estender ping_loop |
| `taskmind/tray-app/requirements.txt` | ✏️ adicionar winotify |
