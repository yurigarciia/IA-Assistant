import sys
import threading
import webbrowser
import pystray
import keyboard
from PIL import Image, ImageDraw, ImageFont
import api_client
import modal
from config import API_URL, DASHBOARD_URL, HOTKEY


def build_icon(online: bool = True) -> Image.Image:
    """Gera o ícone da bandeja programaticamente."""
    size = 64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    color = "#7c6af7" if online else "#555770"
    draw.ellipse([4, 4, size - 4, size - 4], fill=color)
    try:
        fnt = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 28)
    except Exception:
        fnt = ImageFont.load_default()
    draw.text((size // 2, size // 2), "T", font=fnt, fill="white", anchor="mm")
    return img


def open_dashboard():
    webbrowser.open(DASHBOARD_URL)


def on_hotkey():
    threading.Thread(target=modal.open_modal, daemon=True).start()


def setup_startup():
    """Adiciona o app ao startup do Windows via registro."""
    try:
        import winreg
        import os
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        app_path = os.path.abspath(sys.argv[0])
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE) as key:
            winreg.SetValueEx(key, "TaskMind", 0, winreg.REG_SZ, f'"{app_path}"')
        return True
    except Exception:
        return False


def remove_startup():
    try:
        import winreg
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE) as key:
            winreg.DeleteValue(key, "TaskMind")
        return True
    except Exception:
        return False


def check_startup_enabled() -> bool:
    try:
        import winreg
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path) as key:
            winreg.QueryValueEx(key, "TaskMind")
            return True
    except Exception:
        return False


def build_menu(icon_ref: list) -> pystray.Menu:
    startup_enabled = check_startup_enabled()

    def toggle_startup(icon, item):
        if check_startup_enabled():
            remove_startup()
        else:
            setup_startup()
        icon.menu = build_menu(icon_ref)
        icon.update_menu()

    return pystray.Menu(
        pystray.MenuItem("✦ TaskMind", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem(f"Nova tarefa  ({HOTKEY.upper()})", lambda: on_hotkey()),
        pystray.MenuItem("Abrir dashboard", lambda: open_dashboard()),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem(
            "Iniciar com o Windows",
            toggle_startup,
            checked=lambda item: check_startup_enabled(),
        ),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Sair", lambda icon, item: icon.stop()),
    )


def main():
    icon_ref = [None]

    keyboard.add_hotkey(HOTKEY, on_hotkey, suppress=False)

    online = api_client.health_check()
    img = build_icon(online)

    icon = pystray.Icon(
        name="TaskMind",
        icon=img,
        title="TaskMind" + ("" if online else " (offline)"),
        menu=build_menu(icon_ref),
    )
    icon_ref[0] = icon

    def ping_loop():
        import time
        while True:
            time.sleep(30)
            is_online = api_client.health_check()
            icon.icon = build_icon(is_online)
            icon.title = "TaskMind" + ("" if is_online else " (servidor offline)")

    threading.Thread(target=ping_loop, daemon=True).start()

    icon.run()


if __name__ == "__main__":
    main()
