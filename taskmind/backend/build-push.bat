@echo off
echo === TaskMind API - Build e Push para Docker Hub ===
echo.

set IMAGE=ygarciia/taskmind-api

echo Buildando imagem...
docker build -t %IMAGE%:latest .
if errorlevel 1 (
    echo ERRO: Falha no build.
    pause
    exit /b 1
)

echo.
echo Fazendo push para Docker Hub...
docker push %IMAGE%:latest
if errorlevel 1 (
    echo ERRO: Falha no push. Verifique se fez login com: docker login
    pause
    exit /b 1
)

echo.
echo === Concluido! Imagem disponivel em: %IMAGE%:latest ===
pause
