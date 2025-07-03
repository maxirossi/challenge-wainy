#!/bin/bash
set -e

# Configuración
IMPORTER_URL="http://localhost:3000/upload"
API_URL="http://localhost:8000/api"
TEST_FILE="test-real-bcra.txt"
CUIT="20-00390552-8"

# 1. Subir archivo a ms-importer
if [ ! -f "$TEST_FILE" ]; then
  echo "❌ Archivo de prueba $TEST_FILE no encontrado en el root del proyecto."
  exit 1
fi

echo "Subiendo archivo de prueba a ms-importer..."
curl -s -F "file=@$TEST_FILE" "$IMPORTER_URL" | tee upload_result.json

# 2. Esperar a que el worker procese (puedes ajustar el tiempo)
echo "Esperando procesamiento (10s)..."
sleep 10

