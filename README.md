# 🧪 Wayni Móvil – Challenge Backend (Laravel + NestJS + Next.js)

Este proyecto implementa una arquitectura de microservicios completa para procesar archivos del BCRA y exponer consultas sobre los deudores. Está compuesto por:

🟦 **NestJS (ms-importer)**: lectura y procesamiento de archivos del BCRA, integración con AWS S3, SQS y DynamoDB vía LocalStack.

🟪 **Laravel (ms-api)**: exposición de una API REST completa para consultar deudores y entidades almacenadas en MySQL.

🟩 **Next.js (frontend)**: interfaz web moderna con dashboard completo para consultas y estadísticas.

🟨 **MySQL**: almacenamiento relacional de deudores y entidades.

🟫 **LocalStack**: servicios AWS simulados: S3, SQS, DynamoDB.

## 🧱 Requisitos

- Docker
- Docker Compose
- make (opcional para comandos abreviados)

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/tuusuario/wayni-challenge.git
cd wayni-challenge
```

### 2. Configurar archivos .env
Copiar los .env.example de cada servicio:

```bash
cp ms-importer/.env.example ms-importer/.env
cp ms-api/.env.example ms-api/.env
cp frontend/.env.example frontend/.env
```

### 3. Levantar todos los servicios
```bash
docker-compose up --build
```

Esto levantará:

- **MySQL** (localhost:3306)
- **LocalStack** (localhost:4566)
- **Laravel API** (localhost:8000)
- **NestJS** (localhost:3000)
- **Frontend Next.js** (localhost:3001)

## 📦 Servicios disponibles

### 📥 Importador (ms-importer)
**Endpoint para subir archivo:** `POST /upload`

Interactúa con:
- **DynamoDB** (deudores)
- **S3** (almacenamiento archivo original)
- **SQS** (opcional: enviar evento de finalización)

**Respuesta del endpoint:**
```json
{
  "message": "File processed successfully",
  "processedLines": 100,
  "s3Key": "bcra-files/2025-07-03T13-47-49-632Z-small-100.txt",
  "importacionId": "ce78b873-63ab-4d0c-9aa1-485d2dea90e0",
  "cantidadErrores": 0,
  "tamanoArchivo": 17199,
  "tiempoProcesamiento": 2663
}
```

#### 📊 Sistema de Logging

El ms-importer incluye un sistema completo de logging que registra toda la información de las importaciones:

**Archivos de Log:**
- `logs_importer/import_{importacionId}_{fecha}.json` - Logs de importación
- `logs_importer/errors_{fecha}.json` - Logs de errores

**Información registrada:**
- ID de importación y timestamp
- Nombre, tamaño y tipo de archivo
- Clave S3 donde se almacenó el archivo
- Líneas procesadas y cantidad de errores
- Tiempo de procesamiento
- Estado de la importación (iniciado/completado/error)
- Detalles de errores por línea

**Endpoints de Logs:**
```http
GET /logs/imports                    # Todos los logs de importación
GET /logs/imports?date=2025-07-03    # Logs filtrados por fecha
GET /logs/errors                     # Logs de errores
GET /logs/errors?date=2025-07-03     # Errores filtrados por fecha
GET /logs/imports/{importacionId}    # Log específico de importación
GET /logs/summary                    # Resumen estadístico
```

**Ejemplo de respuesta del resumen:**
```json
{
  "success": true,
  "data": {
    "totalImports": 5,
    "successfulImports": 4,
    "failedImports": 1,
    "totalProcessedLines": 1500,
    "totalErrors": 25,
    "totalFileSize": 5242880,
    "averageProcessingTime": 1250,
    "errorLogs": 8,
    "lastImport": { ... }
  }
}
```

### 🌐 API Laravel (ms-api)

#### Endpoints disponibles:

**Deudores:**
- `GET /api/deudores/list?page=1&per_page=20` - Lista paginada de deudores
- `GET /api/deudores/{cuit}` - Buscar deudor por CUIT
- `GET /api/deudores/top/{n}` - Top N deudores con mayor deuda

**Entidades:**
- `GET /api/entidades/{codigo}` - Información de entidad financiera

**Estadísticas:**
- `GET /api/stats` - Estadísticas generales del sistema

**Webhooks:**
- `POST /webhook/notify` - Laravel puede recibir notificación desde SNS/SQS o NestJS

### 💻 Frontend (Next.js)

#### Páginas disponibles:

1. **Home** (`/`) - Upload de archivos TXT
   - Interfaz drag & drop para archivos
   - Progreso de carga
   - Información detallada del procesamiento

2. **Deudores** (`/deudores`) - Lista paginada de deudores
   - Tabla con todos los campos
   - Paginación (20 registros por página)
   - Navegación anterior/siguiente

3. **Buscar por CUIT** (`/about`) - Búsqueda individual
   - Campo de entrada para CUIT
   - Resultado detallado del deudor
   - Tabla con todos los campos

4. **Top** (`/top`) - Deudores con mayor deuda
   - Selector de cantidad (default: 5)
   - Ranking de deudores por monto
   - Información de total deuda y cantidad de préstamos

5. **Entidades** (`/entidades`) - Información de entidades
   - Búsqueda por código de entidad
   - Información detallada de la entidad
   - Dashboard de métricas (total deuda, deudores, vencidos, irregulares)

6. **Estadísticas** (`/stats`) - Dashboard general
   - Resumen general del sistema
   - Distribución por situación de deudores
   - Top entidades
   - Métricas visuales con formateo de moneda

#### Características del Frontend:
- **UI moderna** con Tailwind CSS y Radix UI
- **Responsive design** para móviles y desktop
- **Estados de carga** con spinners
- **Manejo de errores** con mensajes claros
- **Formateo de moneda** en pesos argentinos
- **Navegación intuitiva** con sidebar
- **Hot reload** en desarrollo

## 🧪 Test de LocalStack

Para ver los recursos creados automáticamente:

```bash
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

## 🧹 Comandos útiles

```bash
# Reiniciar el entorno
docker-compose down -v
docker-compose up --build

# Reiniciar servicios específicos
docker-compose restart ms-api
docker-compose restart ms-importer
docker-compose restart frontend

# Rebuild sin cache
docker-compose build --no-cache

# Entrar a un contenedor
docker exec -it ms-api bash
docker exec -it ms-importer sh
docker exec -it frontend sh

# Ver logs
docker-compose logs -f ms-api
docker-compose logs -f ms-importer
docker-compose logs -f frontend

# Acceder a logs de importación
curl http://localhost:3000/logs/summary                    # Resumen estadístico
curl http://localhost:3000/logs/imports                    # Todos los logs
curl http://localhost:3000/logs/imports?date=2025-07-03    # Logs por fecha
curl http://localhost:3000/logs/errors                     # Logs de errores

# Ver archivos de log dentro del contenedor
docker exec ms-importer ls -la logs_importer/
docker exec ms-importer cat logs_importer/import_*.json
```

## 🔧 Uso de AWS CLI con LocalStack

Para poder interactuar con los servicios simulados de AWS (S3, SQS, DynamoDB), necesitás configurar credenciales falsas y una región.

### ✅ Opción 1: usar variables de entorno por comando (sin configuración global)
```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 --region us-east-1 s3 ls
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs list-queues
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 --region us-east-1 dynamodb list-tables
```

### ✅ Opción 2: configurar AWS CLI de forma permanente (recomendado)

Crear carpeta de configuración si no existe:
```bash
mkdir -p ~/.aws
```

Crear archivo `~/.aws/credentials` con:
```ini
[default]
aws_access_key_id = test
aws_secret_access_key = test
```

Crear archivo `~/.aws/config` con:
```ini
[default]
region = us-east-1
output = json
```

Con esto ya podés usar los comandos directamente:
```bash
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 sqs list-queues
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
```

## 📦 Recursos creados por defecto en LocalStack

El archivo `localstack/init.sh` se encarga de crear los siguientes recursos automáticamente cuando LocalStack arranca:

- **Bucket S3**: `deudores-bcra-bucket`
- **Tabla DynamoDB**: `deudores_bcra` (con cuit como clave primaria)
- **Cola SQS**: `deudores-queue`

Podés verificar su existencia con los comandos anteriores.

## 🎯 Funcionalidades implementadas

### Backend:
- ✅ Procesamiento de archivos TXT del BCRA
- ✅ Almacenamiento en S3 y DynamoDB
- ✅ API REST completa con paginación
- ✅ Búsquedas por CUIT y entidad
- ✅ Estadísticas generales del sistema
- ✅ Integración con SQS para procesamiento asíncrono

### Frontend:
- ✅ Dashboard completo con 6 páginas funcionales
- ✅ Upload de archivos con feedback visual
- ✅ Listado paginado de deudores
- ✅ Búsquedas individuales por CUIT
- ✅ Ranking de deudores top
- ✅ Información detallada de entidades
- ✅ Dashboard de estadísticas generales
- ✅ UI moderna y responsive

## 📝 Autor

Desarrollado por Maximiliano Rossi – Challenge técnico de Wayni Móvil


