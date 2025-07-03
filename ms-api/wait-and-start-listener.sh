#!/bin/bash

QUEUE_URL="http://localstack:4566/000000000000/deudores-import-queue"
MAX_ATTEMPTS=60
SLEEP_BETWEEN=2

# Detect if awslocal is available, otherwise use aws
if command -v awslocal &> /dev/null; then
  AWS_CMD=awslocal
else
  AWS_CMD="aws --endpoint-url=http://localstack:4566"
fi

echo "⏳ Esperando a que LocalStack y la cola SQS estén disponibles..."

for ((i=1;i<=MAX_ATTEMPTS;i++)); do
  $AWS_CMD sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names All > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Cola SQS disponible después de $i intentos."
    break
  fi
  echo "⏳ Intento $i/$MAX_ATTEMPTS: Cola no disponible aún, esperando $SLEEP_BETWEEN segundos..."
  sleep $SLEEP_BETWEEN
done

if [ $i -gt $MAX_ATTEMPTS ]; then
  echo "❌ No se pudo encontrar la cola después de $MAX_ATTEMPTS intentos. Saliendo."
  exit 1
fi

echo "🚀 Ejecutando listener PHP..."
php /var/www/sqs-listener.php 