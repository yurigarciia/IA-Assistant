@echo off
echo === TaskMind Tray App - Instalacao ===
echo.

:: Instalar dependencias
echo Instalando dependencias Python...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias.
    pause
    exit /b 1
)

:: Copiar .env se nao existir
if not exist .env (
    echo Criando .env a partir do exemplo...
    copy .env.example .env
    echo IMPORTANTE: Edite o arquivo .env com a URL correta da API.
)

echo.
echo === Instalacao concluida! ===
echo.
echo Para rodar: python main.py
echo Para registrar no startup do Windows: use o menu do icone na bandeja.
echo.
pause
