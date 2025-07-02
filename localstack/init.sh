#!/bin/bash

echo "⏳ Inicializando recursos en LocalStack..."

awslocal s3 mb s3://deudores-bcra-bucket

awslocal sqs create-queue --queue-name deudores-queue

awslocal dynamodb create-table \
  --table-name deudores_bcra \
  --attribute-definitions AttributeName=cuit,AttributeType=S \
  --key-schema AttributeName=cuit,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

echo "✅ Recursos creados: S3, SQS, DynamoDB"
