# TaskMind — Frontend

Dashboard web para o TaskMind. Kanban com drag & drop no desktop, layout mobile com abas, e PWA instalável no celular.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — estilização utilitária
- **@dnd-kit/core** — drag & drop acessível entre colunas do kanban
- **SWR** — fetch com revalidação automática a cada 15s
- **@ducanh2912/next-pwa** — service worker + manifesto PWA

---

## Estrutura

```
src/
├── app/
│   ├── layout.tsx          # Root layout: metadata PWA, manifest, viewport
│   ├── page.tsx            # Entry point: switch desktop ↔ mobile via useIsMobile
│   └── globals.css         # Reset + variáveis Tailwind
├── components/
│   ├── Header.tsx          # Barra superior: busca + botão nova tarefa (adaptável mobile)
│   ├── KanbanBoard.tsx     # Kanban 5 colunas com drag & drop (desktop)
│   ├── KanbanCard.tsx      # Card com urgência, tags, prazo e ações inline
│   ├── NewTaskModal.tsx    # Modal de nova tarefa (texto livre → ingest API)
│   └── mobile/
│       ├── MobileLayout.tsx      # Layout mobile: tab bar por status + lista
│       ├── MobileTaskCard.tsx    # Card mobile com botões Mover e Comentar
│       └── MobileStatusSheet.tsx # Bottom sheet para mover entre status
├── hooks/
│   └── useIsMobile.ts      # MediaQueryList: true se largura < 768px
├── lib/
│   └── api.ts              # Funções tipadas de chamada à API
└── types/
    └── task.ts             # Tipos TypeScript: Task, Interaction, etc.

public/
├── manifest.json           # PWA: name, icons, theme_color, display standalone
├── favicon.svg             # Ícone "T" roxo em SVG
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Variáveis de Ambiente

Crie `.env.local` na raiz do frontend:

```env
NEXT_PUBLIC_API_URL=http://SEU_IP_VPN:8000
```

Em produção (Docker), passe como variável de ambiente no container ou via `--build-arg`.

---

## Desenvolvimento Local

```bash
npm install

# Crie .env.local com a URL da API
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev        # http://localhost:3000
```

> O service worker (PWA) só é gerado no build de produção. Em desenvolvimento, o `@ducanh2912/next-pwa` é desabilitado automaticamente.

---

## Docker

```bash
# Build
docker build -t taskmind-frontend .

# Run (porta 3010 por convenção do projeto)
docker run -d \
  --name taskmind-frontend \
  -p 3010:3000 \
  -e NEXT_PUBLIC_API_URL=http://SEU_IP:8000 \
  taskmind-frontend
```

Imagem pública: `ygarciia/taskmind-frontend:latest`

```bash
docker pull ygarciia/taskmind-frontend:latest
docker run -d --name taskmind-frontend -p 3010:3000 \
  -e NEXT_PUBLIC_API_URL=http://SEU_IP:8000 \
  ygarciia/taskmind-frontend:latest
```

---

## PWA

O manifesto em `public/manifest.json` configura a instalação como app standalone.

Para instalar no **Android**: abra no Chrome → menu → "Adicionar à tela inicial".  
Para instalar no **iOS**: abra no Safari → compartilhar → "Adicionar à tela de início".

A cor do tema (`#7c6af7`) é aplicada na barra de status do sistema quando instalado.

---

## Kanban (Desktop)

5 colunas, cada uma mapeada a um status:

| Coluna | Status |
|--------|--------|
| Aberta | `aberta` |
| Em Progresso | `em_progresso` |
| Aguardando | `aguardando` |
| Revisando | `revisando` |
| Concluída | `concluida` |

Drag & drop entre colunas faz `PATCH /api/tasks/{id}` com o novo status e aplica atualização otimista local antes da confirmação do servidor.

---

## Layout Mobile

Ativado automaticamente abaixo de 768px via `useIsMobile`.

- **Tab bar** no topo filtra por status
- Cada tarefa exibe urgência, projeto e botões "Mover" e "Comentar"
- "Mover" abre um bottom sheet com todos os status disponíveis (exceto o atual)
- "Comentar" expande um campo de texto inline

---

## Build e Push (Docker Hub)

```bash
docker build -t ygarciia/taskmind-frontend:latest .
docker push ygarciia/taskmind-frontend:latest
```
