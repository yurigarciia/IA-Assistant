import webbrowser
import logging
import api_client
from config import DASHBOARD_URL

log = logging.getLogger(__name__)

URGENCIA_LABEL = {"critica": "🔴 Crítica", "alta": "🟠 Alta", "media": "🟡 Média", "baixa": "🟢 Baixa"}


def _parse_urgencia(mensagem: str) -> str:
    """Extrai a urgência da mensagem no formato 'titulo [urgencia]'."""
    if "[" in mensagem and mensagem.endswith("]"):
        urg = mensagem.rsplit("[", 1)[-1].rstrip("]").strip()
        return URGENCIA_LABEL.get(urg, urg)
    return ""


def _show_toast(titulo_tarefa: str, urgencia_label: str) -> None:
    try:
        from winotify import Notification, audio

        toast = Notification(
            app_id="TaskMind",
            title="TaskMind — Tarefa pendente",
            msg=f"{titulo_tarefa}\nUrgência: {urgencia_label}" if urgencia_label else titulo_tarefa,
            duration="long",
            launch=DASHBOARD_URL,
        )
        toast.set_audio(audio.Reminder, loop=False)
        toast.show()
    except Exception as e:
        log.error(f"Notifier: erro ao exibir toast: {e}")


def check_and_notify() -> None:
    """Busca notificações desktop pendentes, exibe toast e confirma entrega."""
    pending = api_client.get_pending_notifications()
    if not pending:
        return

    log.info(f"Notifier: {len(pending)} notificação(ões) pendente(s)")

    for notif in pending:
        mensagem = notif.get("mensagem") or ""
        titulo = mensagem.rsplit("[", 1)[0].strip() if "[" in mensagem else mensagem
        urgencia_label = _parse_urgencia(mensagem)

        _show_toast(titulo, urgencia_label)

        entregue = api_client.ack_notification(notif["id"])
        if entregue:
            log.info(f"Notifier: entregue e confirmado — {titulo!r}")
        else:
            log.warning(f"Notifier: toast exibida mas falha ao confirmar ack para {notif['id']}")
