# Prompts — Notificação Windows via Tray App

Registro dos prompts dados ao Claude Code durante o desenvolvimento desta expansão.

---

## P01 — Proposta da feature

> "a ideia é implementar uma nova feature (notificação no windows via tray app, a notificação de atividade pendente, que atualmente é só via telegram), e ver como é adaptado a estrutura do projeto a essa nova feature"

**Decisão gerada:** o tray app assume papel de consumidor de notificações via polling no backend. O backend cria registros de notificação com campo `entregue_tray=False`; o tray app consulta um novo endpoint `GET /api/notifications/pending` a cada 30s e exibe Windows toast notifications.

---

## P02 — Estrutura de specs para a nova feature

> "essa parte ja ta feita, como documentamos as specs para continuar com a nova implementação? criamos uma pasta de expansões? e dentro dela uma pasta pra cada nova?"

**Decisão gerada:** criar `docs/expansoes/<nome-da-feature>/` com `requisitos.md`, `criterios-aceite.md`, `design.md` e `prompts.md`. Specs antes do código — o PLAN.md é atualizado após a implementação.

---

## P03 — Ajuste de som e prioridade após teste real

> "a tarefa chegou, mas como meu windows fica no modo silencioso, ela não apareceu, ela precisa ser de 'alta prioridade', e seria legal emitir um som sutil também. Cliquei na notificação e abriu o dashboard."

**Decisão gerada:** trocar `audio.Default` por `audio.Reminder` e `duration="short"` por `duration="long"`. Testado também `win11toast` com `scenario="reminder"` e `scenario="alarm"` — nenhum bypassa o DND do Windows 11 para apps sem AUMID registrado. Solução definitiva: usuário adiciona TaskMind nas exceções de DND nas configurações do Windows. Documentado como limitação conhecida em `criterios-aceite.md`.

---
