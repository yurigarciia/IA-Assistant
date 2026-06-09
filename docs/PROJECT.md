# TaskMind — Gestor de Tarefas Pessoal com IA Proativa

> Documentação de concepção, arquitetura e proposta de solução  
> Disciplina: Laboratório de Inovação  
> Autor: Yuri Garcia  
> Data: Junho de 2026

---

## Sumário

1. [O Problema](#1-o-problema)
2. [Contexto do Usuário](#2-contexto-do-usuário)
3. [Tentativas Anteriores e Por Que Falharam](#3-tentativas-anteriores-e-por-que-falharam)
4. [Requisitos da Solução](#4-requisitos-da-solução)
5. [Proposta de Solução](#5-proposta-de-solução)
6. [Arquitetura Técnica](#6-arquitetura-técnica)
7. [Fluxos Principais](#7-fluxos-principais)
8. [Stack Tecnológica](#8-stack-tecnológica)
9. [Infraestrutura](#9-infraestrutura)
10. [Módulos do Sistema](#10-módulos-do-sistema)
11. [Diferenciais e Inovação](#11-diferenciais-e-inovação)
12. [Roadmap de Desenvolvimento](#12-roadmap-de-desenvolvimento)

---

## 1. O Problema

Gerenciar tarefas em múltiplos contextos (projetos, clientes, vida pessoal) é um desafio real para profissionais que transitam entre vários ambientes de trabalho e projetos simultâneos. O acúmulo de pendências sem visibilidade clara causa:

- **Esquecimento de tarefas críticas** por falta de lembretes contextuais
- **Sobrecarga cognitiva** ao tentar manter tudo "na cabeça"
- **Perda de contexto** ao alternar entre projetos distintos
- **Fricção no registro** — ferramentas complexas desincentivam a captura rápida de uma ideia ou pendência

> *"Usar o WhatsApp como lista de afazeres é, no mínimo, vergonhoso para alguém com conhecimento técnico."*  
> — Usuário, descrevendo sua situação atual

---

## 2. Contexto do Usuário

### Perfil

- Profissional técnico com múltiplos projetos simultâneos em contextos distintos
- Alto volume de pendências com diferentes níveis de urgência e prazo
- Transita entre ambientes: notebook pessoal, PC da empresa e smartphone

### Ambientes de Uso

```
┌─────────────────────────────────────────────────────────────┐
│                    AMBIENTES DO USUÁRIO                     │
├──────────────────┬──────────────────┬───────────────────────┤
│  Notebook Pessoal│   PC da Empresa  │      Smartphone       │
│                  │                  │                       │
│  Windows         │  Windows         │  Android/iOS          │
│  Uso doméstico   │  Uso majoritário │  Uso em trânsito      │
│  e projetos      │  do dia a dia    │  e notificações       │
└──────────────────┴──────────────────┴───────────────────────┘
                           │
                    Rede VPN Privada
                           │
                  ┌────────────────┐
                  │Servidor Caseiro│
                  │  (IP fixo VPN) │
                  └────────────────┘
```

### Infraestrutura Disponível

| Recurso | Detalhe |
|---|---|
| Servidor doméstico | Disponível 24/7, capaz de rodar serviços |
| VPN privada | IP fixo, acesso seguro de qualquer dispositivo |
| Conta Gemini (paga) | API de IA disponível |
| Conhecimento técnico | Capaz de desenvolver e manter a solução |

---

## 3. Tentativas Anteriores e Por Que Falharam

### Notion

| Problema | Impacto |
|---|---|
| Interface complexa e densa | Alta fricção para registrar tarefas rápidas |
| Não é visualmente direto | Difícil ver o panorama geral de uma vez |
| Demanda configuração constante | Tempo gasto organizando, não fazendo |
| Sem proatividade | Você precisa lembrar de abrir o Notion |

### WhatsApp como lista de tarefas

| Problema | Impacto |
|---|---|
| Sem estrutura | Tarefas se perdem no histórico |
| Sem priorização | Tudo parece igual |
| Sem lembretes contextuais | Depende da memória humana |
| Não é escalável | Solução improvisada, não sustentável |

### Padrão de Falha Identificado

```
Ferramenta genérica
        ↓
Alta configuração inicial
        ↓
Baixa adoção no dia a dia
        ↓
Abandono gradual
        ↓
Retorno ao WhatsApp/cabeça
```

**Conclusão:** o problema não é falta de disciplina — é falta de uma ferramenta que se adapte ao fluxo natural do usuário, e não o contrário.

---

## 4. Requisitos da Solução

### Requisitos Funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | Captura rápida de tarefas em linguagem natural | Alta |
| RF02 | Visualização clara da lista de afazeres | Alta |
| RF03 | Marcar tarefas como concluídas | Alta |
| RF04 | Adicionar comentários/anotações a tarefas | Alta |
| RF05 | Lembretes proativos sem necessidade de definir data | Alta |
| RF06 | Acesso sincronizado em todos os dispositivos | Alta |
| RF07 | Input via tray icon no Windows (modal rápido) | Alta |
| RF08 | Notificações via Telegram | Média |
| RF09 | Inferência automática de urgência pela IA | Alta |
| RF10 | Histórico e contexto das tarefas para a IA | Média |

### Requisitos Não-Funcionais

| ID | Requisito |
|---|---|
| RNF01 | Auto-hospedado (dados próprios, sem dependência de terceiros) |
| RNF02 | Acessível via VPN em qualquer dispositivo |
| RNF03 | Interface responsiva (funciona no celular via browser) |
| RNF04 | Baixo custo de manutenção |
| RNF05 | Disponibilidade 24/7 (roda no servidor doméstico) |
| RNF06 | Captura de tarefa em menos de 10 segundos |

---

## 5. Proposta de Solução

### Conceito

**TaskMind** é um sistema pessoal de gestão de tarefas com IA proativa, auto-hospedado, acessível de qualquer dispositivo via VPN, com múltiplos pontos de entrada e um motor de inteligência que observa o comportamento do usuário para disparar lembretes contextuais automaticamente — sem que o usuário precise definir datas ou regras.

### Princípios de Design

1. **Captura zero-fricção** — registrar uma tarefa deve ser mais rápido do que abrir o WhatsApp
2. **IA que serve, não que demanda** — o usuário não configura regras, a IA infere
3. **Visibilidade imediata** — ao abrir qualquer interface, o panorama está visível
4. **Proatividade assíncrona** — o sistema age mesmo quando o usuário não está olhando
5. **Dados próprios** — nada sai do servidor doméstico sem autorização

### Como Funciona (visão do usuário)

```
VOCÊ ESTÁ NO WINDOWS (PC da empresa ou notebook)
    ↓
Clica no ícone TaskMind na bandeja do sistema
    ↓
┌─────────────────────────────────────────┐
│ ✦ TaskMind                         [X] │
│                                         │
│  O que você precisa fazer?              │
│  ┌───────────────────────────────────┐  │
│  │ terminar relatório do cliente X   │  │
│  └───────────────────────────────────┘  │
│                           [Salvar →]    │
└─────────────────────────────────────────┘
    ↓
A IA analisa: "relatório + cliente = urgência comercial → alta prioridade"
    ↓
Tarefa aparece na to-do list visual (web, qualquer dispositivo)
    ↓
3 dias depois, sem interação:
Telegram: "Ei, você já terminou o relatório do cliente X?"
```

---

## 6. Arquitetura Técnica

### Visão Geral

```
┌───────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVOS DO USUÁRIO                    │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│  │ Windows Tray │   │  Browser/PWA │   │  Telegram (celular)  │   │
│  │     App      │   │ (qualquer    │   │                      │   │
│  │              │   │ dispositivo) │   │                      │   │
│  └──────┬───────┘   └─────┬────────┘   └──────────┬───────────┘   │
└─────────┼─────────────────┼───────────────────────┼───────────────┘
          │                 │                       │
          └─────────────────┼───────────────────────┘
                            │  HTTPS via VPN (IP fixo)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVIDOR DOMÉSTICO                           │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   FastAPI        │    │    Next.js       │                       │
│  │   (Backend)      │◄──►│    (Frontend)    │                       │
│  │   Python         │    │    PWA           │                       │
│  └────────┬─────────┘    └──────────────────┘                       │
│           │                                                         │
│    ┌──────┴────────────────────────────────┐                        │
│    │                                       │                        │
│    ▼                                       ▼                        │
│  ┌──────────────┐               ┌─────────────────────┐             │
│  │  PostgreSQL  │               │  APScheduler        │             │
│  │  (Banco de   │               │  (Motor Proativo)   │             │
│  │   Dados)     │               │                     │             │
│  └──────────────┘               └──────────┬──────────┘             │
│                                            │                        │
│                              ┌─────────────┴──────────┐             │
│                              │                        │             │
│                              ▼                        ▼             │
│                   ┌─────────────────┐    ┌───────────────────┐      │
│                   │  Ollama         │    │   Telegram Bot    │      │
│                   │  (LLM Local)    │    │   (Notificações)  │      │
│                   │  llama3/mistral │    │                   │      │
│                   └─────────────────┘    └───────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │
          │  Chamadas externas (quando necessário)
          ▼
┌──────────────────────┐
│   Gemini API         │
│   (Google Cloud)     │
│   Parsing rápido     │
│   Resumos            │
└──────────────────────┘
```

### Distribuição de Responsabilidades por Modelo de IA

| Tarefa | Modelo | Justificativa |
|---|---|---|
| Parsing de linguagem natural (input) | Gemini API | Velocidade e precisão, baixa latência |
| Inferência de urgência | Gemini API | Raciocínio contextual de qualidade |
| Motor proativo (análise noturna) | Ollama (local) | Roda sem custo, pode ser intensivo |
| Resumo semanal de tarefas | Gemini API | Qualidade de geração de texto |
| Respostas conversacionais | Ollama (local) | Sem custo para interações frequentes |

---

## 7. Fluxos Principais

### Fluxo 1 — Captura de Tarefa (Windows Tray)

```
Usuário clica no ícone
        │
        ▼
Modal abre (< 1 segundo)
        │
        ▼
Usuário digita em linguagem natural
"preciso revisar o contrato do cliente Y antes da reunião"
        │
        ▼
[Salvar] pressionado
        │
        ▼
POST /api/tasks/ingest
        │
        ▼
Gemini analisa o texto
  - Entidade: "contrato do cliente Y"
  - Contexto: "antes de reunião" → urgência ALTA
  - Projeto inferido: "cliente Y"
  - Prazo: indefinido, mas iminente
        │
        ▼
Tarefa salva no PostgreSQL com metadados
  {
    "titulo": "Revisar contrato do cliente Y",
    "urgencia": "alta",
    "projeto": "cliente Y",
    "prazo_inferido": null,
    "pressao_crescente": true,
    "criada_em": "2026-06-01T14:32:00"
  }
        │
        ▼
Modal fecha
Tarefa aparece na to-do list em todos os dispositivos
```

### Fluxo 2 — Motor de Proatividade

```
APScheduler executa (ex: a cada 6 horas)
        │
        ▼
Busca tarefas no banco:
  - Abertas há mais de N dias sem interação
  - Alta urgência sem resolução
  - Tarefas "esquecidas" (sem comentário recente)
        │
        ▼
Envia contexto para Ollama (LLM local):
  "Aqui estão as tarefas abertas do usuário.
   Quais merecem um lembrete agora?
   Considere urgência, tempo desde criação e contexto."
        │
        ▼
LLM retorna lista priorizada com justificativa
        │
        ▼
Sistema dispara notificações:
  ┌──────────────────────────────────────────┐
  │ 🔔 Telegram                             │
  │                                          │
  │ Ei! Você ainda precisa revisar o         │
  │ contrato do cliente Y.                   │
  │ Já faz 4 dias desde que você registrou   │
  │ isso. Quer marcar como feito ou          │
  │ adicionar uma nota?                      │
  │                                          │
  │ [✅ Feito] [💬 Comentar] [⏭ Adiar]     │
  └──────────────────────────────────────────┘
        │
        ▼
Usuário responde via Telegram
        │
        ▼
API atualiza o banco de dados
```

### Fluxo 3 — Visualização e Interação (Web/PWA)

```
Usuário abre o browser (qualquer dispositivo na VPN)
        │
        ▼
Dashboard carrega

┌──────────────────────────────────────────────────────┐
│  TaskMind                             [+ Nova]  [⚙] │
├──────────────────────────────────────────────────────┤
│  HOJE                                                │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🔴 Revisar contrato cliente Y       [✓] [💬]  │  │
│  │ 🟡 Atualizar documentação do projeto A [✓][💬]│  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ESTA SEMANA                                         │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🟢 Enviar proposta cliente Z        [✓] [💬]  │  │
│  │ 🟢 Estudar módulo 3 do curso        [✓] [💬]  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  SEM PRAZO / BACKLOG                                 │
│  ┌────────────────────────────────────────────────┐  │
│  │ ⚪ Organizar arquivos do servidor   [✓] [💬]  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 8. Stack Tecnológica

### Backend

```
Python 3.12+
│
├── FastAPI          — API REST assíncrona, documentação automática (Swagger)
├── SQLAlchemy       — ORM para PostgreSQL
├── Pydantic         — Validação de dados e schemas
├── APScheduler      — Agendamento do motor proativo
├── httpx            — Cliente HTTP async (chamadas para Gemini/Ollama)
└── python-telegram-bot — Integração com Telegram
```

### Frontend

```
Next.js 14+ (React)
│
├── TypeScript       — Tipagem estática
├── Tailwind CSS     — Estilização rápida e responsiva
├── SWR              — Sincronização de dados em tempo real
├── PWA (next-pwa)   — Instalável no celular como app
└── React Query      — Cache e atualização de estado servidor
```

### Windows Tray App

```
Python
│
├── pystray          — Ícone na bandeja do sistema
├── tkinter / webview— Modal de captura
└── requests         — Envio para a API local
```

### Banco de Dados

```
PostgreSQL 15+
│
├── Tabela: tasks         — Tarefas principais
├── Tabela: interactions  — Histórico de interações (comentários, status)
├── Tabela: ai_context    — Metadados gerados pela IA
└── Tabela: notifications — Histórico de notificações enviadas
```

### IA e LLMs

```
┌─────────────────────────────────────────────────────┐
│  Gemini API (Google)          Ollama (local)        │
│  - gemini-1.5-flash           - llama3 / mistral    │
│  - Parsing de input           - Motor proativo      │
│  - Inferência de urgência     - Análise noturna     │
│  - Resumos                    - Sem custo adicional │
└─────────────────────────────────────────────────────┘
```

---

## 9. Infraestrutura

### Servidor Doméstico

Os serviços rodam diretamente no servidor (sem Docker Compose), aproveitando a infraestrutura já existente:

| Serviço | Como roda | Observação |
|---|---|---|
| PostgreSQL | Já em execução | Banco existente — apenas criar as tabelas do TaskMind |
| FastAPI (backend) | `uvicorn` via `pm2` ou serviço systemd | Porta 8000 |
| Next.js (frontend) | `pm2` ou serviço systemd | Porta 3000 |
| Ollama | Binário nativo ou serviço | Porta 11434 (interno) |
| Nginx | Já configurado ou a configurar | Proxy reverso + HTTPS |

### Rede

```
Internet
    │
    └── VPN (WireGuard/OpenVPN)
            │
            └── IP Fixo do Servidor
                    │
                    ├── :443  → Nginx → Next.js (frontend)
                    ├── :8000 → Nginx → FastAPI (API)
                    └── :11434 → Ollama (interno apenas)
```

### Acesso por Dispositivo

| Dispositivo | Como acessa | Interface |
|---|---|---|
| Windows (qualquer PC) | VPN + browser | PWA / Tray App |
| Smartphone | VPN + browser | PWA instalada |
| Telegram | Bot (sem VPN necessária) | Bot interativo |

---

## 10. Módulos do Sistema

### Módulo 1 — Ingestor de Tarefas (`/ingest`)

Responsável por receber texto em linguagem natural e transformar em tarefa estruturada.

**Entrada:** `"preciso terminar o relatório do cliente X antes da reunião de sexta"`  
**Saída:**
```json
{
  "titulo": "Terminar relatório do cliente X",
  "projeto": "Cliente X",
  "urgencia": "alta",
  "contexto": "antes de reunião",
  "prazo_inferido": "próxima sexta-feira",
  "tags": ["relatório", "reunião", "cliente"],
  "requer_acompanhamento": true
}
```

### Módulo 2 — Motor de Proatividade (`/scheduler`)

Analisa o banco periodicamente e decide quais tarefas merecem atenção.

**Lógica de pressão crescente:**
```
Tarefa criada
    ↓ 3 dias sem interação  → lembrete leve
    ↓ 7 dias sem interação  → lembrete médio
    ↓ 14 dias sem interação → lembrete urgente + pergunta de status
    ↓ 30 dias sem interação → sugestão de arquivar ou repensar
```

### Módulo 3 — API REST (`/api`)

| Endpoint | Método | Descrição |
|---|---|---|
| `/tasks` | GET | Lista todas as tarefas |
| `/tasks/ingest` | POST | Cria tarefa via linguagem natural |
| `/tasks/{id}` | PATCH | Atualiza status/comentário |
| `/tasks/{id}/complete` | POST | Marca como concluída |
| `/tasks/summary` | GET | Resumo gerado pela IA |
| `/webhook/telegram` | POST | Recebe respostas do Telegram |

### Módulo 4 — Interface Web (`/frontend`)

- Dashboard com tarefas agrupadas por urgência/contexto
- Filtros por projeto, status, data
- Modal rápido de nova tarefa (alternativa ao tray app)
- Histórico de interações por tarefa
- Responsivo — funciona igual no celular e desktop

### Módulo 5 — Windows Tray App (`/tray`)

- Roda em background ao iniciar o Windows
- Ícone na bandeja do sistema (system tray)
- Clique abre modal minimalista
- Envio para a API via HTTP
- Notificações desktop para lembretes

### Módulo 6 — Telegram Bot (`/bot`)

- Recebe novas tarefas por mensagem
- Envia lembretes proativos com botões interativos
- Permite marcar como feito, comentar ou adiar diretamente pelo chat

---

## 11. Diferenciais e Inovação

### Comparativo com Soluções Existentes

| Funcionalidade | Notion | Todoist | TaskMind |
|---|---|---|---|
| Captura < 10 segundos | ❌ | ✅ | ✅ |
| Linguagem natural | ⚠️ parcial | ⚠️ parcial | ✅ completo |
| Proatividade sem configurar datas | ❌ | ❌ | ✅ |
| Auto-hospedado | ❌ | ❌ | ✅ |
| Dados próprios | ❌ | ❌ | ✅ |
| Tray app Windows | ❌ | ❌ | ✅ |
| Custo mensal | $10-16 | $4-6 | ~$0 (infra própria) |

### Inovações Técnicas

1. **Inferência de urgência sem metadados** — o usuário não precisa definir prioridade; a IA extrai do contexto semântico
2. **Pressão crescente adaptativa** — o intervalo dos lembretes aumenta dinamicamente conforme o tempo de inatividade e a urgência inferida
3. **Hibridização de modelos** — tarefas rápidas via API (Gemini), análises profundas via LLM local (Ollama), reduzindo custo
4. **Multi-input unificado** — tray, web, PWA e Telegram escrevem no mesmo banco com a mesma lógica

---

## 12. Roadmap de Desenvolvimento

```
FASE 1 — Fundação (Semana 1-2)
├── Setup do servidor (Docker Compose)
├── Banco de dados PostgreSQL + schemas
├── API FastAPI com endpoints básicos (CRUD de tarefas)
└── Frontend Next.js básico (lista + criar tarefa)

FASE 2 — IA e Input (Semana 3-4)
├── Integração com Gemini API (parsing de linguagem natural)
├── Inferência de urgência e metadados
├── Windows Tray App (ícone + modal)
└── Input por texto livre funcionando end-to-end

FASE 3 — Proatividade (Semana 5-6)
├── Setup do Ollama no servidor
├── Motor de proatividade (APScheduler)
├── Lógica de pressão crescente
└── Integração com Telegram Bot (notificações + botões)

FASE 4 — Refinamento (Semana 7-8)
├── PWA (instalável no celular)
├── Filtros e agrupamentos na UI
├── Histórico e comentários por tarefa
├── Resumo semanal automatizado
└── Testes e ajustes de experiência
```

---

## Conclusão

O **TaskMind** resolve uma dor real de gestão pessoal através de uma abordagem que prioriza a **captura zero-fricção** e a **proatividade inteligente**. Em vez de exigir que o usuário se adapte à ferramenta, o sistema se adapta ao comportamento natural do usuário — capturando intenções em linguagem natural, inferindo contexto e urgência automaticamente, e agindo de forma proativa para garantir que nada seja esquecido.

A combinação de infraestrutura própria (servidor doméstico + VPN), modelos de IA híbridos (Gemini + Ollama) e múltiplos pontos de entrada (tray, web, Telegram) cria um sistema personalizado, privado e de baixo custo que supera as soluções comerciais disponíveis no que mais importa: **praticidade e autonomia do usuário**.
