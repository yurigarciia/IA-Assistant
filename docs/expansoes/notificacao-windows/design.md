# Design Técnico — Notificação Windows via Tray App

Decisões de arquitetura tomadas **antes** da implementação.

---

## Problema Central

O backend roda em Docker no servidor Linux. Quem precisa exibir a notificação é o Windows do usuário. O backend não pode chamar o tray app diretamente — o tray app é quem vai ao backend buscar o que precisa exibir.

---

## Decisão de Arquitetura: Pull vs Push

**Opção A — Push (backend chama o tray app):**
- Backend faz HTTP para um servidor embutido no tray app
- ❌ Tray app precisaria expor porta, tratar firewall, lidar com IP dinâmico

**Opção B — Pull (tray app consulta o backend):**
- Tray app já tem um ping loop a cada 30s
- Estende esse loop para também buscar notificações pendentes
- ✅ Sem porta adicional, sem estado no tray app, sem complexidade de callback

**Decisão: Pull (Opção B)**

---

## Fluxo Completo

```
APScheduler (backend)
    │ proactivity_check seleciona tarefas via Ollama
    │
    ▼
scheduler_service.py
    │ cria Notification(canal="desktop", entregue_tray=False)
    │ continua criando Notification(canal="telegram") como antes
    ▼
banco (tabela notifications)

                    ← polling 30s ←
Tray App (Windows)
    │ GET /api/notifications/pending
    │ recebe lista de notificações não entregues
    │
    ├── para cada notificação:
    │   ├── exibe Windows toast (winotify)
    │   └── POST /api/notifications/{id}/ack
    ▼
banco atualizado: entregue_tray=True
```

---

## Mudanças por Camada

### Backend — modelo (migrations)

Adicionar campo `entregue_tray` na tabela `notifications`:

```python
# migration 0003_notif_tray.py
entregue_tray: Mapped[bool] = mapped_column(Boolean, default=False)
```

### Backend — novos endpoints

```
GET  /api/notifications/pending   → lista notifications onde entregue_tray=False e canal="desktop"
POST /api/notifications/{id}/ack  → marca entregue_tray=True
```

Novo arquivo: `taskmind/backend/app/routers/notifications.py`

### Backend — scheduler_service.py

Após enviar via Telegram, também criar registro para o canal desktop:

```python
db.add(Notification(task_id=task.id, canal="desktop", mensagem=msg, entregue_tray=False))
```

### Tray App — novo arquivo

`taskmind/tray-app/notifier.py` — responsável por:
1. Buscar `/api/notifications/pending`
2. Exibir toast com `winotify`
3. Confirmar entrega via `/ack`

### Tray App — main.py

Estender o `ping_loop` existente:

```python
def ping_loop():
    while True:
        time.sleep(30)
        is_online = api_client.health_check()
        icon.icon = build_icon(is_online)
        if is_online:
            notifier.check_and_notify()   # ← novo
```

### Tray App — requirements.txt

Adicionar: `winotify==1.1.0`

### Tray App — api_client.py

Adicionar funções:
- `get_pending_notifications() -> list[dict]`
- `ack_notification(notification_id: str) -> bool`

---

## Biblioteca escolhida: winotify

Alternativas avaliadas:

| Lib | Prós | Contras |
|-----|------|---------|
| `win10toast` | Popular | Não mantida, bugs no Win11 |
| `plyer` | Cross-platform | Dependência pesada |
| `winotify` | Leve, Win10/11, suporta callback de clique | Apenas Windows |

**Decisão: `winotify`** — leve, mantida, suporta ação de clique para abrir o dashboard.

---

## Arquivos novos e alterados

```
taskmind/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   └── notifications.py        ← NOVO
│   │   ├── models/task.py              ← ALTERADO (campo entregue_tray)
│   │   └── services/scheduler_service.py ← ALTERADO (cria notif desktop)
│   └── migrations/versions/
│       └── 0003_notif_tray.py          ← NOVO
└── tray-app/
    ├── notifier.py                     ← NOVO
    ├── api_client.py                   ← ALTERADO (+2 funções)
    ├── main.py                         ← ALTERADO (ping_loop estendido)
    └── requirements.txt                ← ALTERADO (+winotify)
```

Total: 3 arquivos novos, 4 alterados.
