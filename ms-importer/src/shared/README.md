# Shared Module

Este módulo contiene todos los elementos compartidos entre los diferentes módulos de la aplicación, siguiendo los principios de Domain-Driven Design (DDD).

## Estructura

```
src/shared/
├── infrastructure/          # Capa de infraestructura compartida
│   ├── logging/            # Sistema de logging con Winston
│   ├── database/           # Configuración y conexiones de BD
│   ├── aws/                # Clientes y configuraciones de AWS
│   ├── http/               # Utilidades HTTP
│   ├── exceptions/         # Excepciones de infraestructura
│   └── utils/              # Utilidades generales
├── domain/                 # Capa de dominio compartida
│   ├── entities/           # Entidades base
│   ├── value-objects/      # Value Objects compartidos
│   ├── exceptions/         # Excepciones de dominio
│   └── interfaces/         # Interfaces base
└── application/            # Capa de aplicación compartida
    ├── dto/                # DTOs base
    ├── interfaces/         # Interfaces de aplicación
    └── decorators/         # Decoradores útiles
```

## Uso

### Logging

```typescript
import { LoggerService } from '@/shared';

// Uso directo
LoggerService.info('Mensaje informativo');
LoggerService.error('Error ocurrido', error);

// Obtener instancia del logger
const logger = LoggerService.getInstance().getLogger();
logger.debug('Debug message', { metadata: 'value' });
```

### Decoradores

```typescript
import { LogMethod, LogError } from '@/shared';

class MiServicio {
  @LogMethod()
  async miMetodo() {
    // El método será loggeado automáticamente
  }

  @LogError()
  async metodoConError() {
    // Solo los errores serán loggeados
  }
}
```

### DTOs Base

```typescript
import { BaseResponseDto, ErrorResponseDto } from '@/shared';

// Respuesta exitosa
const response = BaseResponseDto.success(data, 'Operación exitosa');

// Respuesta de error
const errorResponse = ErrorResponseDto.fromException(exception);
```

### Utilidades

```typescript
import { DateUtils, StringUtils } from '@/shared';

// Formateo de fechas
const fecha = DateUtils.formatDate(new Date(), 'DD/MM/YYYY');

// Manipulación de strings
const slug = StringUtils.slugify('Mi Título');
```

### Excepciones

```typescript
import { ValidationException, DatabaseException } from '@/shared';

// Lanzar excepciones específicas
throw ValidationException.invalidInput('email', value);
throw DatabaseException.connectionError();
```

## Principios

1. **Reutilización**: Todos los elementos aquí definidos deben ser reutilizables
2. **Independencia**: No debe depender de módulos específicos del negocio
3. **Consistencia**: Mantener patrones consistentes en toda la aplicación
4. **Testabilidad**: Todos los elementos deben ser fácilmente testables
5. **Documentación**: Cada elemento debe estar bien documentado

## Agregando Nuevos Elementos

Al agregar nuevos elementos al módulo shared:

1. Colócalos en la carpeta apropiada según su capa
2. Actualiza el archivo `index.ts` con las exportaciones
3. Agrega documentación en este README
4. Crea tests unitarios para el nuevo elemento
5. Asegúrate de que no tenga dependencias de módulos específicos del negocio 