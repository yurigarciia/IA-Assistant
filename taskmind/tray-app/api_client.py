import requests
from config import API_URL


def ingest_task(texto: str) -> dict | None:
    try:
        resp = requests.post(
            f"{API_URL}/api/tasks/ingest",
            json={"texto": texto},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        return None
    except requests.exceptions.Timeout:
        return None
    except Exception:
        return None


def health_check() -> bool:
    try:
        resp = requests.get(f"{API_URL}/api/health", timeout=5)
        return resp.status_code == 200
    except Exception:
        return False
