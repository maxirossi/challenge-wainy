# MS-API - Microservicio de API Laravel

Este es el microservicio de API REST desarrollado en Laravel para el Challenge Técnico de Wayni Móvil. Se encarga de exponer endpoints para consultar información de deudores y entidades financieras procesadas por el microservicio de importación.

## 🏗️ Arquitectura

El microservicio implementa **Domain-Driven Design (DDD)** con las siguientes capas:

```
app/
├── Domains/                    # Capa de dominio
│   ├── Deudores/              # Dominio de deudores
│   │   ├── Entities/          # Entidades del dominio
│   │   ├── Repositories/      # Interfaces de repositorios
│   │   ├── Services/          # Servicios de dominio
│   │   └── ValueObjects/      # Objetos de valor (CUIT)
│   └── EntidadesFinancieras/  # Dominio de entidades financieras
│       ├── Entities/
│       ├── Repositories/
│       ├── Services/
│       └── ValueObjects/
├── Application/               # Capa de aplicación
│   └── UseCases/             # Casos de uso
├── Infrastructure/           # Capa de infraestructura
│   └── Persistence/         # Implementaciones de repositorios
└── Http/                    # Capa de presentación
    └── Controllers/         # Controladores de la API
```

## 🚀 Características

- **Arquitectura DDD** con separación clara de responsabilidades
- **Value Objects** para CUIT y códigos de entidad con validación
- **API REST** con endpoints para consulta de deudores y entidades
- **Integración con SQS** para recibir datos del microservicio de importación
- **Base de datos MySQL** para almacenamiento persistente
- **Jobs asíncronos** para procesamiento de mensajes SQS
- **Health checks** y estadísticas del sistema
- **Tests unitarios** para value objects, entidades, servicios, casos de uso, jobs y SQS
- **Linter profesional** (PHP CS Fixer) y scripts de calidad de código

## 📋 Endpoints de la API

### Deudores
- `GET /api/deudores/{cuit}` - Obtiene resumen de deudor por CUIT
- `GET /api/deudores/top/{n}` - Obtiene top N deudores con mayor deuda

### Entidades Financieras
- `GET /api/entidades/{codigo}` - Obtiene resumen de entidad por código

### Sistema
- `GET /api/health` - Health check del sistema

## 🔧 Configuración

### Variables de Entorno

```env
APP_NAME=WayniAPI
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Base de datos
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=wayni
DB_USERNAME=wayni_user
DB_PASSWORD=secret

# AWS/SQS (LocalStack)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1
AWS_ENDPOINT=http://localstack:4566
SQS_PREFIX=http://localstack:4566/000000000000
SQS_QUEUE=deudores-queue
SQS_QUEUE_URL=http://localstack:4566/000000000000/deudores-queue

# Colas
QUEUE_CONNECTION=sqs

# Nota: Copia estas variables a tu archivo .env para asegurar la conexión correcta con LocalStack y la cola SQS creada por el script init.sh.
```

## 🛠️ Instalación y Ejecución

### 1. Instalar dependencias
```bash
composer install
```

### 2. Configurar base de datos
```bash
cp .env.example .env
# Editar .env con las configuraciones de tu entorno
php artisan key:generate
```

### 3. Ejecutar migraciones y seeders
```bash
php artisan migrate
php artisan db:seed
```

### 4. Iniciar el servidor
```bash
php artisan serve
```

### 5. Ejecutar listener de SQS (en otra terminal)
```bash
# Usar el script PHP personalizado para procesar mensajes SQS
php /var/www/sqs-listener.php
```

## 📊 Estructura de Datos

### Tabla: deudores
- `cuit` - CUIT del deudor (formato: XX-XXXXXXXX-X)
- `codigo_entidad` - Código de la entidad financiera
- `tipo_deuda` - Tipo de deuda (préstamo, tarjeta, etc.)
- `monto_deuda` - Monto de la deuda
- `situacion` - Situación del deudor (normal, irregular, vencida, morosa)
- `fecha_vencimiento` - Fecha de vencimiento (opcional)
- `fecha_procesamiento` - Fecha de procesamiento

### Tabla: entidades_financieras
- `codigo` - Código único de la entidad
- `nombre` - Nombre de la entidad
- `tipo_entidad` - Tipo (banco, financiera, cooperativa)
- `activa` - Estado activo/inactivo

## 🔄 Integración con SQS

El microservicio recibe mensajes JSON directos de SQS con la siguiente estructura:

```json
{
  "deudores": [
    {
      "cuit": "20-12345678-9",
      "codigo_entidad": "BANCO001",
      "tipo_deuda": "préstamo personal",
      "monto_deuda": 150000.00,
      "situacion": "normal",
      "fecha_vencimiento": "2024-12-31",
      "fecha_procesamiento": "2024-01-01T00:00:00Z",
      "nombre_entidad": "Banco de la Nación Argentina",
      "tipo_entidad": "banco"
    }
  ]
}
```

## 🧪 Testing y Calidad de Código

### Tests Unitarios

El proyecto incluye tests unitarios para:
- Value Objects (`Cuit`, `CodigoEntidad`)
- Entidades (`Deudor`)
- Servicios de dominio
- Casos de uso de aplicación
- Servicio de integración SQS

Puedes ejecutar los tests con:

```bash
# Todos los tests
composer test

# Solo tests unitarios
composer test:unit

# Solo tests de features
composer test:feature

# Tests con coverage
composer test:coverage
```

### Linter y Formato de Código

Se utiliza **PHP CS Fixer** para mantener el código limpio y consistente.

```bash
# Corregir automáticamente el código
composer lint

# Solo mostrar problemas de formato
composer lint:check

# Corregir y luego correr tests
composer quality:fix
```

El archivo `.php-cs-fixer.php` contiene la configuración de reglas para el linter.

### Scripts útiles en composer.json

- `composer test` - Ejecuta todos los tests
- `composer test:unit` - Ejecuta solo los tests unitarios
- `composer test:feature` - Ejecuta solo los tests de features
- `composer test:coverage` - Ejecuta tests con coverage
- `composer lint` - Corrige el formato de código automáticamente
- `composer lint:check` - Solo muestra problemas de formato
- `composer lint:fix` - Corrige el formato de código
- `composer quality` - Linter + tests
- `composer quality:fix` - Linter (fix) + tests

## 📝 Logs

Los logs se encuentran en `storage/logs/laravel.log` y incluyen:
- Procesamiento de mensajes SQS
- Errores de validación
- Operaciones de base de datos
- Health checks

## 🔍 Monitoreo

- **Health Check**: `GET /api/health`
- **Estadísticas**: `GET /api/stats`
- **Logs**: `tail -f storage/logs/laravel.log`

## 🚀 Comandos Útiles

```bash
# Verificar estado de la cola SQS
php /var/www/sqs-listener.php

# Limpiar cache
php artisan cache:clear

# Ver rutas disponibles
php artisan route:list
```

## 📚 Tecnologías Utilizadas

- **Laravel 12** - Framework PHP
- **MySQL** - Base de datos
- **AWS SDK PHP** - Cliente AWS
- **SQS** - Cola de mensajes
- **Eloquent ORM** - Mapeo objeto-relacional
- **PHPUnit** - Testing

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte del Challenge Técnico de Wayni Móvil.

# Para procesamiento de SQS simplemente ejecuta:
php /var/www/sqs-listener.php

# El script procesa mensajes JSON directos de la cola SQS y los envía al endpoint /process-sqs de Laravel.
