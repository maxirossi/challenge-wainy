#!/bin/bash

echo "⏳ Inicializando recursos en LocalStack..."

# Crear bucket S3
echo "📦 Creando bucket S3..."
awslocal s3 mb s3://deudores-bcra-bucket

# Crear cola SQS
echo "📨 Creando cola SQS..."
awslocal sqs create-queue --queue-name deudores-queue

# Crear tabla importaciones_bcra
echo "🗄️  Creando tabla importaciones_bcra..."
awslocal dynamodb create-table \
  --table-name importaciones_bcra \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Crear tabla deudores_bcra con GSI
echo "👥 Creando tabla deudores_bcra..."
awslocal dynamodb create-table \
  --table-name deudores_bcra \
  --attribute-definitions \
    AttributeName=cuit,AttributeType=S \
    AttributeName=importacionId,AttributeType=S \
  --key-schema AttributeName=cuit,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"importacionId-index","KeySchema":[{"AttributeName":"importacionId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Crear tabla importaciones_errores con GSI
echo "❌ Creando tabla importaciones_errores..."
awslocal dynamodb create-table \
  --table-name importaciones_errores \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=importacionId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"importacionId-index","KeySchema":[{"AttributeName":"importacionId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST

# Esperar a que las tablas estén activas
echo "⏳ Esperando que las tablas estén activas..."
awslocal dynamodb wait table-exists --table-name importaciones_bcra
awslocal dynamodb wait table-exists --table-name deudores_bcra
awslocal dynamodb wait table-exists --table-name importaciones_errores

echo "✅ Recursos creados exitosamente:"
echo "   📦 S3 Bucket: deudores-bcra-bucket"
echo "   📨 SQS Queue: deudores-queue"
echo "   🗄️  DynamoDB Tables:"
echo "      - importaciones_bcra"
echo "      - deudores_bcra (con GSI importacionId-index)"
echo "      - importaciones_errores (con GSI importacionId-index)"
