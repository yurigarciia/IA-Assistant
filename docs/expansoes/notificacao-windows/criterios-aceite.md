# Critérios de Aceite — Notificação Windows via Tray App

---

## CA-NW01 — Toast aparece quando há tarefa pendente

**Dado** o tray app rodando e uma tarefa proativa gerada pelo backend com `entregue_tray=False`  
**Quando** o polling de 30s executar  
**Então:**
- Uma toast notification nativa do Windows aparece no canto inferior direito da tela
- Título exibe `"TaskMind — Tarefa pendente"`
- Corpo exibe o título da tarefa e a urgência
- O campo `entregue_tray` é marcado como `True` no banco

**Verificação:** criar manualmente um registro em `notifications` com `entregue_tray=False` e aguardar até 30s

**Resultado observado:** ✅ Toast apareceu em até 30s após chamar `POST /api/notifications/test`. Ajuste aplicado: `audio.Reminder` + `duration="long"` pois `audio.Default` + `duration="short"` não aparecia no modo silencioso do Windows.

---

## CA-NW02 — Notificação não é repetida

**Dado** uma notificação já entregue (`entregue_tray=True`)  
**Quando** o polling executar novamente  
**Então:**
- Nenhuma nova toast é exibida para essa notificação
- `GET /api/notifications/pending` não retorna registros já entregues

**Verificação:** após CA-NW01, aguardar mais 30s e confirmar que nenhuma toast duplicada aparece

---

## CA-NW03 — Clicar na toast abre o dashboard

**Dado** uma toast notification visível na tela  
**Quando** o usuário clicar sobre ela  
**Então:**
- O browser abre na `DASHBOARD_URL` configurada no `.env`

**Verificação:** clicar na toast e confirmar abertura do browser na URL correta (porta 3010)

**Resultado observado:** ✅ Dashboard abriu corretamente ao clicar na toast.

---

## CA-NW04 — Endpoint `/api/notifications/pending` funciona

**Dado** o backend rodando  
**Quando** `GET /api/notifications/pending` for chamado  
**Então:**
- Retorna lista de notificações com `canal="desktop"` e `entregue_tray=False`
- Retorna `[]` se não houver pendências
- HTTP 200 em ambos os casos

**Verificação:**
```bash
curl http://localhost:8000/api/notifications/pending
```

---

## CA-NW05 — Endpoint de confirmação `/ack` funciona

**Dado** uma notificação pendente com id conhecido  
**Quando** `POST /api/notifications/{id}/ack` for chamado  
**Então:**
- `entregue_tray` muda para `True` no banco
- HTTP 200 com o registro atualizado
- Chamadas subsequentes a `/pending` não retornam mais esse registro

**Verificação:**
```bash
curl -X POST http://localhost:8000/api/notifications/{id}/ack
```

---

## CA-NW06 — Tray app não quebra se API estiver offline

**Dado** o tray app rodando com API inacessível  
**Quando** o polling tentar buscar notificações pendentes  
**Então:**
- Nenhuma exception não tratada é lançada
- Ícone na bandeja permanece visível (cinza = offline)
- Próximo ciclo de polling tenta novamente normalmente

**Verificação:** parar a API e observar o tray app por 2 ciclos (60s)

---

## CA-NW07 — Telegram e Windows são independentes

**Dado** `TELEGRAM_BOT_TOKEN` não configurado  
**Quando** o motor proativo gerar uma notificação  
**Então:**
- A notificação desktop ainda é criada no banco e entregue pelo tray app
- Nenhum erro relacionado ao Telegram afeta o fluxo Windows

**Verificação:** remover `TELEGRAM_BOT_TOKEN` do `.env` e confirmar que toasts continuam funcionando
