import os
import sys
from pathlib import Path
from dotenv import load_dotenv

if getattr(sys, "frozen", False):
    # .env embutido no .exe (extraído pelo PyInstaller em sys._MEIPASS)
    load_dotenv(Path(sys._MEIPASS) / ".env")
else:
    load_dotenv(Path(__file__).parent / ".env")

API_URL = os.getenv("API_URL", "http://localhost:8000")
DASHBOARD_URL = os.getenv("DASHBOARD_URL", API_URL.replace(":8000", ":3010"))
HOTKEY = os.getenv("HOTKEY", "ctrl+shift+t")
