#!/bin/bash

IMPORTER_URL="http://localhost:3000/upload"
QUEUE_URL="http://localhost:4566/000000000000/deudores-import-queue"
FILE="e2e-test/test-real-bcra.txt"

# 1. Enviar el archivo completo al importer (como hace el e2e)
echo "Enviando archivo de prueba al importer..."
curl -s -F "file=@$FILE" "$IMPORTER_URL"

echo "\nEsperando procesamiento (10s)..."
sleep 10

# 2. Consultar mensajes en la cola SQS
echo "\nMensajes en la cola SQS:"
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url "$QUEUE_URL" \
  --max-number-of-messages 10

echo "\nFin del debug." 