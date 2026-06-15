import ctypes
import threading
import tkinter as tk
from tkinter import font as tkfont
import api_client

BG          = "#1c1e2a"
TEXT        = "#e2e4f0"
PLACEHOLDER = "#4a4d63"
ACCENT      = "#7c6af7"
SUCCESS     = "#4ade80"
ERROR       = "#f87171"
HINT        = "#2e3048"
LABEL_COLOR = "#6b6f8e"

W, H = 560, 132

_modal_lock = threading.Lock()


def _dwm(hwnd: int) -> None:
    try:
        pref = ctypes.c_int(2)
        ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, 33, ctypes.byref(pref), ctypes.sizeof(pref))
        dark = ctypes.c_int(1)
        ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, 20, ctypes.byref(dark), ctypes.sizeof(dark))
    except Exception:
        pass


def open_modal():
    if not _modal_lock.acquire(blocking=False):
        return

    root = tk.Tk()
    root.withdraw()

    win = tk.Toplevel(root)
    win.title("TaskMind")
    win.resizable(False, False)
    win.overrideredirect(True)
    win.attributes("-topmost", True)
    win.attributes("-alpha", 0.97)
    win.configure(bg=BG)

    sw, sh = win.winfo_screenwidth(), win.winfo_screenheight()
    win.geometry(f"{W}x{H}+{(sw-W)//2}+{(sh-H)//2 - 80}")

    win.update_idletasks()
    hwnd = ctypes.windll.user32.GetParent(win.winfo_id())
    _dwm(hwnd)

    font_title  = tkfont.Font(family="Segoe UI", size=8, weight="bold")
    font_input  = tkfont.Font(family="Segoe UI", size=13)
    font_status = tkfont.Font(family="Segoe UI", size=9)
    font_hint   = tkfont.Font(family="Segoe UI", size=8)

    pad = tk.Frame(win, bg=BG)
    pad.pack(fill="both", expand=True, padx=20, pady=16)

    # --- Título + hint na mesma linha ---
    row_title = tk.Frame(pad, bg=BG)
    row_title.pack(fill="x", pady=(0, 8))

    tk.Label(row_title, text="✦  Nova tarefa", font=font_title,
             bg=BG, fg=ACCENT).pack(side="left")
    tk.Label(row_title, text="Enter para salvar  ·  Esc para fechar",
             font=font_hint, bg=BG, fg=LABEL_COLOR).pack(side="right")

    # --- Input ---
    entry = tk.Entry(pad, font=font_input, bg=HINT, fg=TEXT,
                     insertbackground=ACCENT, relief="flat",
                     highlightthickness=1, highlightbackground=HINT,
                     highlightcolor=ACCENT, bd=8,
                     disabledbackground=HINT, disabledforeground=PLACEHOLDER)
    entry.pack(fill="x")

    # --- Barra de progresso animada ---
    bar_bg = tk.Frame(pad, bg=HINT, height=2)
    bar_bg.pack(fill="x", pady=(6, 0))
    bar_bg.pack_propagate(False)

    bar_fill = tk.Frame(bar_bg, bg=BG, height=2)
    bar_fill.place(x=0, y=0, width=0, height=2)

    # --- Status ---
    status_var = tk.StringVar()
    lbl_status = tk.Label(pad, textvariable=status_var, font=font_status,
                          bg=BG, fg=PLACEHOLDER, anchor="w")
    lbl_status.pack(fill="x", pady=(4, 0))

    # Placeholder
    _ph = [True]

    def show_ph():
        if not entry.get():
            _ph[0] = True
            entry.insert(0, "Ex: revisar contrato do cliente até sexta...")
            entry.config(fg=PLACEHOLDER)

    def hide_ph(e=None):
        if _ph[0]:
            entry.delete(0, "end")
            entry.config(fg=TEXT)
            _ph[0] = False

    show_ph()
    entry.bind("<FocusIn>",  hide_ph)
    entry.bind("<FocusOut>", lambda e: show_ph() if not entry.get() else None)

    # Arrastar
    def start_drag(e):
        win._dx = e.x_root - win.winfo_x()
        win._dy = e.y_root - win.winfo_y()

    def do_drag(e):
        win.geometry(f"+{e.x_root - win._dx}+{e.y_root - win._dy}")

    for w in (pad, row_title):
        w.bind("<ButtonPress-1>", start_drag)
        w.bind("<B1-Motion>",     do_drag)

    # Animação de progresso
    _anim = [None]

    def start_progress():
        bar_fill.config(bg=ACCENT)
        total_w = bar_bg.winfo_width() or W - 40
        _pos = [0]
        chunk = total_w // 20

        def tick():
            _pos[0] = min(_pos[0] + chunk, total_w)
            bar_fill.place(x=0, y=0, width=_pos[0], height=2)
            if _pos[0] < total_w:
                _anim[0] = win.after(60, tick)

        tick()

    def finish_bar(color):
        if _anim[0]:
            win.after_cancel(_anim[0])
        total_w = bar_bg.winfo_width() or W - 40
        bar_fill.place(x=0, y=0, width=total_w, height=2)
        bar_fill.config(bg=color)

    def close():
        _modal_lock.release()
        win.destroy()
        root.destroy()

    def submit(e=None):
        if _ph[0]:
            return
        texto = entry.get().strip()
        if not texto:
            return

        entry.config(state="disabled")
        status_var.set("Enviando...")
        lbl_status.config(fg=PLACEHOLDER)
        start_progress()
        win.update()

        def do_request():
            result = api_client.ingest_task(texto)
            if result:
                titulo = result.get("task", {}).get("titulo", texto[:40])
                finish_bar(SUCCESS)
                status_var.set(f"✓  {titulo[:62]}")
                lbl_status.config(fg=SUCCESS)
                win.after(1300, close)
            else:
                finish_bar(ERROR)
                status_var.set("✗  Sem conexão com o servidor")
                lbl_status.config(fg=ERROR)
                entry.config(state="normal")
                entry.focus_set()

        threading.Thread(target=do_request, daemon=True).start()

    win.bind("<Escape>",         lambda e: close())
    entry.bind("<Return>",       submit)
    win.bind("<Control-Return>", submit)

    win.after(0,  win.lift)
    win.after(0,  win.focus_force)
    win.after(50, entry.focus_force)
    win.grab_set()

    root.mainloop()
