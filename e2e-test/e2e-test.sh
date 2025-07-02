#!/bin/bash
set -e

# Configuración
IMPORTER_URL="http://localhost:3000/upload"
API_URL="http://localhost:8000/api"
TEST_FILE="test-real-bcra.txt"
CUIT="20003905528"

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

# 3. Consultar API ms-api por CUIT
echo "Consultando API ms-api por CUIT $CUIT..."
curl -s "$API_URL/deudores/$CUIT" | tee result.json

# 4. Validar que la respuesta contiene datos esperados (ejemplo: total_deuda > 0)
if grep -q '"total_deuda":[1-9]' result.json; then
  echo "✔️  E2E OK: Deudor encontrado y procesado"
  exit 0
else
  echo "❌  E2E FAIL: No se encontró el deudor o no fue procesado"
  exit 1
fi 