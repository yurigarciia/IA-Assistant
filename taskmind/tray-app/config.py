import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

API_URL = os.getenv("API_URL", "http://localhost:8000")
HOTKEY = os.getenv("HOTKEY", "ctrl+shift+t")
