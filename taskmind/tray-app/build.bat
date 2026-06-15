@echo off
echo ==================================================
echo  TaskMind Tray App -- Build ^> .exe
echo ==================================================

cd /d "%~dp0"

echo.
echo [1/3] Instalando dependencias...
pip install -r requirements.txt --quiet --user
if errorlevel 1 (
    echo ERRO: falha ao instalar dependencias
    pause
    exit /b 1
)

echo [2/3] Verificando .env...
if not exist ".env" (
    echo ERRO: arquivo .env nao encontrado.
    echo Crie o .env com API_URL, DASHBOARD_URL e HOTKEY antes de buildar.
    pause
    exit /b 1
)

echo [3/3] Gerando executavel com PyInstaller (com .env embutido)...
set PYINSTALLER=%APPDATA%\Python\Python312\Scripts\pyinstaller.exe
if not exist "%PYINSTALLER%" set PYINSTALLER=pyinstaller
"%PYINSTALLER%" taskmind.spec --noconfirm --clean
if errorlevel 1 (
    echo ERRO: falha no build
    pause
    exit /b 1
)

echo [4/4] Finalizando...

echo.
echo ==================================================
echo  Build concluido!
echo  Executavel: dist\TaskMind.exe
echo.
echo  O .env foi embutido no executavel.
echo  Distribua apenas o TaskMind.exe — sem arquivos adicionais.
echo.
echo  IMPORTANTE: na primeira execucao, Windows pode
echo  pedir permissao de administrador (necessario
echo  para o atalho global Ctrl+Shift+T).
echo ==================================================
pause
