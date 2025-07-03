#!/bin/bash

QUEUE_URL="http://localstack:4566/000000000000/deudores-import-queue"
MAX_ATTEMPTS=60
SLEEP_BETWEEN=2

echo "⏳ Esperando a que LocalStack y la cola SQS estén disponibles..."

for ((i=1;i<=MAX_ATTEMPTS;i++)); do
  # Verificar si LocalStack está respondiendo
  if curl -s "http://localstack:4566" > /dev/null 2>&1; then
    echo "✅ LocalStack está disponible después de $i intentos."
    break
  fi
  echo "⏳ Intento $i/$MAX_ATTEMPTS: LocalStack no disponible aún, esperando $SLEEP_BETWEEN segundos..."
  sleep $SLEEP_BETWEEN
done

if [ $i -gt $MAX_ATTEMPTS ]; then
  echo "❌ No se pudo conectar a LocalStack después de $MAX_ATTEMPTS intentos. Saliendo."
  exit 1
fi

echo "🚀 Ejecutando listener PHP..."
php /var/www/sqs-listener.php 