# ms-importer (Wayni Móvil)

Microservicio NestJS para procesamiento y carga de archivos BCRA, integración con AWS (S3, SQS, DynamoDB vía LocalStack), y lógica de negocio de deudores.

## 🚀 ¿Qué hace este microservicio?
- Procesa archivos de deudores del BCRA
- Expone endpoints REST para registrar y consultar deudores
- Utiliza arquitectura DDD (Domain-Driven Design)
- Almacena datos en DynamoDB (o memoria para pruebas)
- Integra infraestructura compartida (logger, excepciones, utilidades, DTOs, decoradores)
- **Sistema de logging detallado** para auditoría de importaciones

## 📦 Estructura relevante

```
src/
├── deudores/                # Módulo de dominio de deudores (DDD)
├── upload/                  # Módulo de procesamiento de archivos
│   ├── import-logger.service.ts  # Sistema de logging de importaciones
│   ├── logs.controller.ts        # Endpoints para consultar logs
│   └── upload.service.ts         # Lógica de procesamiento
├── shared/                  # Infraestructura y utilidades compartidas
│   ├── infrastructure/      # Logging, utils, etc.
│   ├── domain/              # Excepciones, interfaces base
│   ├── application/         # DTOs, decoradores
│   └── index.ts             # Exporta todo lo compartido
└── main.ts                  # Bootstrap NestJS
```

## 📊 Sistema de Logging

El microservicio incluye un sistema completo de logging que registra toda la información de las importaciones:

### Archivos de Log
- **Logs de importación**: `logs_importer/import_{importacionId}_{fecha}.json`
- **Logs de errores**: `logs_importer/errors_{fecha}.json`

### Información registrada
- ID de importación y timestamp
- Nombre, tamaño y tipo de archivo
- Clave S3 donde se almacenó el archivo
- Líneas procesadas y cantidad de errores
- Tiempo de procesamiento
- Estado de la importación (iniciado/completado/error)
- Detalles de errores por línea
- Metadatos de la solicitud

### Endpoints de Logs

#### Obtener logs de importaciones
```http
GET /logs/imports
GET /logs/imports?date=2025-07-03
```

#### Obtener logs de errores
```http
GET /logs/errors
GET /logs/errors?date=2025-07-03
```

#### Obtener log específico
```http
GET /logs/imports/{importacionId}
```

#### Resumen estadístico
```http
GET /logs/summary
```

## ⚙️ Instalación y desarrollo

```bash
npm install
```

### Comandos principales

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build && npm run start:prod

# Linter (corrige solo)
npm run lint

# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura de tests
npm run test:cov
```

## 🧪 Ejecución de pruebas

- Todas las entidades, value objects y excepciones tienen tests unitarios en `src/deudores/domain/value-objects/__tests__`.
- Puedes agregar tests para cualquier clase en `shared` o módulos propios.

## 📝 Ejemplo de uso de logger y decoradores

```typescript
import { LoggerService, LogMethod, LogError } from '@/shared';

class MiServicio {
  @LogMethod()
  async hacerAlgo() {
    LoggerService.info('Ejecutando lógica importante');
    // ...
  }

  @LogError()
  async puedeFallar() {
    throw new Error('Algo salió mal');
  }
}
```

## 🏗️ Extender infraestructura compartida
- Agrega utilidades, excepciones, DTOs, decoradores, etc. en `src/shared/`
- Exporta desde `src/shared/index.ts`
- Documenta en `src/shared/README.md`

## 🛠️ Docker y LocalStack
- El microservicio está preparado para correr en Docker y usar LocalStack para simular AWS (ver README raíz del monorepo para detalles de docker-compose y recursos creados).
- La carpeta `logs_importer` se crea automáticamente en el contenedor.

## 📚 Recursos útiles
- [NestJS Docs (ES)](https://docs.nestjs.com/)
- [Documentación interna en `src/shared/README.md`](./src/shared/README.md)

## 👨‍💻 Autor
Desarrollado por Maximiliano Rossi para el challenge técnico de Wayni Móvil.
