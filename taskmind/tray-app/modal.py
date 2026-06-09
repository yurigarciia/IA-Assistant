import threading
import tkinter as tk
from tkinter import font as tkfont
import api_client

# Cores
BG = "#111218"
BG_INPUT = "#1e2030"
BORDER = "#2d3047"
TEXT = "#e0e0e0"
PLACEHOLDER = "#555770"
ACCENT = "#7c6af7"
ACCENT_HOVER = "#6a59e0"
SUCCESS = "#4ade80"
ERROR = "#f87171"

_modal_lock = threading.Lock()
_modal_open = False


def open_modal():
    global _modal_open
    if not _modal_lock.acquire(blocking=False):
        return
    _modal_open = True

    root = tk.Tk()
    root.withdraw()

    win = tk.Toplevel(root)
    win.title("")
    win.resizable(False, False)
    win.overrideredirect(True)      # sem barra de título
    win.attributes("-topmost", True)
    win.attributes("-alpha", 0.97)
    win.configure(bg=BG)

    W, H = 480, 130
    sw = win.winfo_screenwidth()
    sh = win.winfo_screenheight()
    x = (sw - W) // 2
    y = (sh - H) // 2 - 80
    win.geometry(f"{W}x{H}+{x}+{y}")

    # Borda sutil via frame externo
    outer = tk.Frame(win, bg=BORDER, padx=1, pady=1)
    outer.pack(fill="both", expand=True)
    inner = tk.Frame(outer, bg=BG, padx=16, pady=14)
    inner.pack(fill="both", expand=True)

    # Label topo
    label_font = tkfont.Font(family="Segoe UI", size=9)
    tk.Label(inner, text="Nova tarefa  ·  Ctrl+Enter para salvar  ·  Esc para fechar",
             bg=BG, fg=PLACEHOLDER, font=label_font).pack(anchor="w", pady=(0, 8))

    # Campo de texto
    input_font = tkfont.Font(family="Segoe UI", size=11)
    entry_frame = tk.Frame(inner, bg=ACCENT, padx=1, pady=1)
    entry_frame.pack(fill="x")
    entry = tk.Entry(entry_frame, font=input_font, bg=BG_INPUT, fg=TEXT,
                     insertbackground=TEXT, relief="flat",
                     highlightthickness=0, bd=6)
    entry.pack(fill="x")
    entry.focus_set()

    # Estado de feedback
    status_var = tk.StringVar()
    status_font = tkfont.Font(family="Segoe UI", size=9)
    status_label = tk.Label(inner, textvariable=status_var, bg=BG,
                            font=status_font, fg=PLACEHOLDER)
    status_label.pack(anchor="w", pady=(6, 0))

    def close():
        global _modal_open
        _modal_open = False
        _modal_lock.release()
        win.destroy()
        root.destroy()

    def submit(event=None):
        texto = entry.get().strip()
        if not texto:
            return
        entry.config(state="disabled")
        status_var.set("Enviando...")
        status_label.config(fg=PLACEHOLDER)
        win.update()

        def do_request():
            result = api_client.ingest_task(texto)
            if result:
                titulo = result.get("task", {}).get("titulo", texto[:40])
                status_var.set(f"✓  Salvo: {titulo[:50]}")
                status_label.config(fg=SUCCESS)
            else:
                status_var.set("✗  Sem conexão com o servidor")
                status_label.config(fg=ERROR)
                entry.config(state="normal")
                return
            win.after(1200, close)

        threading.Thread(target=do_request, daemon=True).start()

    win.bind("<Escape>", lambda e: close())
    win.bind("<Control-Return>", submit)
    entry.bind("<Return>", submit)

    root.mainloop()
