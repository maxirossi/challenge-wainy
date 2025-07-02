🧪 Wayni Móvil – Challenge Backend (Laravel + NestJS)
Este proyecto implementa una arquitectura de microservicios para procesar archivos del BCRA y exponer consultas sobre los deudores. Está compuesto por:

🟦 NestJS (ms-importer): lectura y procesamiento de archivos del BCRA, integración con AWS S3, SQS y DynamoDB vía LocalStack.

🟪 Laravel (ms-api): exposición de una API REST para consultar deudores y entidades almacenadas en MySQL.

🟩 Next.js (frontend): interfaz web de consulta (opcional).

🟨 MySQL: almacenamiento relacional.

🟫 LocalStack: servicios AWS simulados: S3, SQS, DynamoDB.

🧱 Requisitos
Docker

Docker Compose

make (opcional para comandos abreviados)

🚀 Instalación y ejecución
1. Clonar el repositorio
bash
Copiar
Editar
git clone https://github.com/tuusuario/wayni-challenge.git
cd wayni-challenge
2. Configurar archivos .env
Copiar los .env.example de cada servicio:

bash
Copiar
Editar
cp ms-importer/.env.example ms-importer/.env
cp ms-api/.env.example ms-api/.env
cp frontend/.env.example frontend/.env
3. Levantar todos los servicios
bash
Copiar
Editar
docker-compose up --build
Esto levantará:

MySQL (localhost:3306)

LocalStack (localhost:4566)

Laravel API (localhost:8000)

NestJS (localhost:3000)

Frontend Next.js (localhost:3001)

📦 Servicios disponibles
📥 Importador (ms-importer)
Endpoint para subir archivo: POST /upload

Interactúa con:

DynamoDB (deudores)

S3 (almacenamiento archivo original)

SQS (opcional: enviar evento de finalización)

🌐 API Laravel (ms-api)
GET /deudores/{cuit}

GET /entidades/{codigo}

GET /deudores/top/{n}

POST /webhook/notify ← Laravel puede recibir notificación desde SNS/SQS o NestJS

💻 Frontend (frontend)
Interfaz Next.js de consulta

Conecta vía REST a Laravel API

🧪 Test de LocalStack
Para ver los recursos creados automáticamente:

bash
Copiar
Editar
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 sqs list-queues
🧹 Comandos útiles
bash
Copiar
Editar
# Reiniciar el entorno
docker-compose down -v
docker-compose up --build

# Entrar a un contenedor
docker exec -it ms-api bash
docker exec -it ms-importer sh

# Más info

🔧 Uso de AWS CLI con LocalStack
Para poder interactuar con los servicios simulados de AWS (S3, SQS, DynamoDB), necesitás configurar credenciales falsas y una región.

✅ Opción 1: usar variables de entorno por comando (sin configuración global)
bash
Copiar
Editar
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 --region us-east-1 s3 ls
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs list-queues
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 --region us-east-1 dynamodb list-tables
✅ Opción 2: configurar AWS CLI de forma permanente (recomendado)
Crear carpeta de configuración si no existe:

bash
Copiar
Editar
mkdir -p ~/.aws
Crear archivo ~/.aws/credentials con:

ini
Copiar
Editar
[default]
aws_access_key_id = test
aws_secret_access_key = test
Crear archivo ~/.aws/config con:

ini
Copiar
Editar
[default]
region = us-east-1
output = json
Con esto ya podés usar los comandos directamente:

bash
Copiar
Editar
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 sqs list-queues
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
📦 Recursos creados por defecto en LocalStack
El archivo localstack/init.sh se encarga de crear los siguientes recursos automáticamente cuando LocalStack arranca:

Bucket S3: deudores-bcra-bucket

Tabla DynamoDB: deudores_bcra (con cuit como clave primaria)

Cola SQS: deudores-queue

Podés verificar su existencia con los comandos anteriores.

📝 Autor
Desarrollado por Maximiliano Rossi – Challenge técnico de Wayni Móvil


