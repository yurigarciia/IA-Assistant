# Requisitos — Notificação Windows via Tray App

**Feature:** Notificações proativas de tarefas pendentes no Windows, via tray app  
**Motivação:** Atualmente os lembretes chegam apenas pelo Telegram. O usuário nem sempre está com o celular por perto durante o trabalho no PC — uma notificação nativa do Windows garante que o lembrete seja visto independente do canal.

---

## Requisitos Funcionais

### RF-NW01 — Toast notification no Windows
O tray app deve exibir uma notificação nativa do Windows (toast) quando houver tarefas pendentes selecionadas pelo motor de proatividade, sem que o usuário precise abrir nenhuma interface.

### RF-NW02 — Polling de notificações pendentes
O tray app deve consultar o backend periodicamente para verificar se há notificações ainda não entregues no Windows. O intervalo deve reutilizar o ping loop já existente (30 segundos).

### RF-NW03 — Endpoint de notificações pendentes
O backend deve expor `GET /api/notifications/pending` retornando notificações com `entregue_tray=False`. Após a entrega, o tray app marca como entregue via `POST /api/notifications/{id}/ack`.

### RF-NW04 — Não duplicar notificações
Uma notificação entregue via Windows não deve ser exibida novamente. O campo `entregue_tray` no banco garante isso.

### RF-NW05 — Canal independente do Telegram
A notificação Windows deve ser disparada mesmo que o Telegram não esteja configurado ou o usuário não responda pelo bot. Os dois canais são complementares, não dependentes um do outro.

### RF-NW06 — Conteúdo da notificação
A toast deve exibir:
- Título: `"TaskMind — Tarefa pendente"`
- Corpo: título da tarefa + urgência
- Ao clicar: abrir o dashboard no browser

---

## Requisitos Não-Funcionais

| ID | Requisito |
|----|-----------|
| RNF-NW01 | Funcionar em Windows 10 e Windows 11 |
| RNF-NW02 | Não bloquear o loop principal do tray app |
| RNF-NW03 | Falha na notificação não deve derrubar o tray app |
| RNF-NW04 | Sem dependência de servidor de notificação externo — tudo local |

---

## O que NÃO está no escopo

- Botões interativos na toast (responder, concluir) — complexidade de callback desnecessária por ora
- Notificações agendadas por horário fixo — o motor proativo já controla o timing
- Suporte a macOS/Linux — o tray app é exclusivo para Windows
