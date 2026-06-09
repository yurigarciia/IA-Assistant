#!/bin/bash
# Executa as migrations do Alembic usando a imagem Docker da API.
# Rode este script uma vez no servidor antes de subir o container principal.
#
# Uso:
#   chmod +x run-migrations.sh
#   DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/taskmind" ./run-migrations.sh

set -e

if [ -z "$DATABASE_URL" ]; then
    echo "ERRO: variavel DATABASE_URL nao definida."
    echo "Uso: DATABASE_URL='postgresql+asyncpg://...' ./run-migrations.sh"
    exit 1
fi

IMAGE="ygarciia/taskmind-api:latest"

echo "=== TaskMind — Executando migrations ==="
echo "Imagem : $IMAGE"
echo "Banco  : $DATABASE_URL"
echo ""

docker run --rm \
    --add-host=host.docker.internal:host-gateway \
    -e DATABASE_URL="$DATABASE_URL" \
    "$IMAGE" \
    alembic upgrade head

echo ""
echo "=== Migrations concluidas com sucesso! ==="
