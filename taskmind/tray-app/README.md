# TaskMind — Tray App

Aplicativo Windows que roda na bandeja do sistema. Abre um modal Spotlight-style com `Ctrl+Shift+T` para captura de tarefas em linguagem natural em menos de 10 segundos.

---

## Funcionalidades

- **Ícone na bandeja** com indicador de status (roxo = online, cinza = offline)
- **Hotkey global** configurável (padrão: `Ctrl+Shift+T`) — abre o modal em qualquer janela
- **Modal de captura** — estilo Spotlight/macOS, cantos arredondados nativos (DWM API do Windows 11), barra de progresso animada
- **Ping automático** a cada 30s para atualizar o indicador de status
- **Iniciar com o Windows** — toggle no menu de contexto, gravado no registro do Windows
- **Abrir dashboard** — abre o browser na URL do painel web

---

## Arquivos

```
tray-app/
├── main.py          # pystray: ícone, menu, hotkey, ping loop
├── modal.py         # tkinter: modal Spotlight + DWM rounded corners + barra animada
├── api_client.py    # requests: health_check + ingest para a API
├── config.py        # .env loader (sys._MEIPASS quando rodando como .exe)
├── taskmind.spec    # PyInstaller spec (.env embutido, console=False, uac_admin=True)
├── build.bat        # Script de build do .exe
├── requirements.txt
└── .env.example
```

---

## Configuração

Copie `.env.example` para `.env` e preencha:

```env
# URL da API (IP da VPN + porta 8000)
API_URL=http://SEU_IP_VPN:8000

# URL do dashboard (IP da VPN + porta 3010)
DASHBOARD_URL=http://SEU_IP_VPN:3010

# Atalho global para abrir o modal
HOTKEY=ctrl+shift+t
```

---

## Rodar do código-fonte

```bash
pip install -r requirements.txt
cp .env.example .env     # preencha API_URL e DASHBOARD_URL
python main.py
```

Requer Python 3.10+ e Windows.

---

## Build do .exe

O `.env` é **embutido dentro do executável** durante o build — nenhum arquivo externo é necessário para distribuição.

```bat
# Edite .env com as URLs corretas ANTES de buildar
build.bat
```

O executável gerado em `dist\TaskMind.exe` é standalone: sem Python, sem dependências, sem `.env` externo.

> **Atenção:** feche o TaskMind da bandeja antes de rebuildar — o Windows não permite sobrescrever um `.exe` em execução.

### O que o build faz

1. Valida que `.env` existe
2. Instala PyInstaller se necessário
3. Executa `pyinstaller taskmind.spec`
4. O `.env` é incluído via `datas=[('.env', '.')]` no spec e extraído para `sys._MEIPASS` em runtime

---

## Modal

O modal segue o estilo do Spotlight do macOS:

```
┌─────────────────────────────────────┐
│  ✦ Nova tarefa            Esc fecha │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Digite a tarefa aqui...       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ████████████░░░░░░░░░░░░░░░░░░░░  │
│  Enviando...                        │
└─────────────────────────────────────┘
```

- Cantos arredondados via `DwmSetWindowAttribute` (DWMWCP_ROUND=2) — apenas Windows 11
- `Enter` envia, `Esc` fecha
- Barra de progresso preenche da esquerda para a direita em ~1,2s
- Verde = tarefa criada com sucesso · Vermelho = erro na API

---

## Dependências

| Pacote | Uso |
|--------|-----|
| `pystray` | Ícone e menu na bandeja do sistema |
| `Pillow` | Geração do ícone programaticamente |
| `keyboard` | Hotkey global (funciona em qualquer janela ativa) |
| `requests` | Chamadas HTTP síncronas para a API |
| `pywin32` | Acesso ao registro do Windows (startup) + DWM API |
| `python-dotenv` | Leitura do `.env` |
| `pyinstaller` | Compilação para `.exe` standalone |

---

## Menu de Contexto (botão direito no ícone)

```
✦ TaskMind
─────────────────
Nova tarefa  (CTRL+SHIFT+T)
Abrir dashboard
─────────────────
☑ Iniciar com o Windows
─────────────────
Sair
```

"Iniciar com o Windows" grava/remove a entrada `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\TaskMind`.
