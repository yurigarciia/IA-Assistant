@echo off
echo === TaskMind Frontend - Build e Push para Docker Hub ===
echo.

set IMAGE=ygarciia/taskmind-frontend
set API_URL=http://100.125.38.37:8000

echo Buildando imagem (API_URL=%API_URL%)...
docker build --build-arg NEXT_PUBLIC_API_URL=%API_URL% -t %IMAGE%:latest .
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
