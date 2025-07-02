# Módulo Deudores - Arquitectura DDD con Value Objects

Este módulo implementa la gestión de deudores siguiendo los principios de Domain-Driven Design (DDD) con Value Objects para encapsular la lógica de negocio.

## Estructura

```
src/deudores/
├── domain/
│   ├── value-objects/
│   │   ├── cuit.value-object.ts           # Value Object para CUIT
│   │   ├── situacion.value-object.ts      # Value Object para situación
│   │   ├── monto.value-object.ts          # Value Object para montos
│   │   └── index.ts                       # Exportaciones
│   ├── deudor.entity.ts                   # Entidad de dominio
│   └── deudor.repository.ts               # Interfaz del repositorio
├── infrastructure/
│   └── repositories/
│       └── in-memory-deudor.repository.ts # Implementación en memoria
├── application/
│   └── use-cases/
│       ├── registrar-deudor.usecase.ts    # Caso de uso: registrar deudor
│       └── obtener-deudor.usecase.ts      # Caso de uso: obtener deudor
├── dto/
│   └── registrar-deudor.dto.ts            # Data Transfer Object
├── deudores.controller.ts                 # Controlador REST
└── deudores.module.ts                     # Módulo NestJS
```

## Value Objects

### CuitValueObject
- **Validaciones:** 11 dígitos numéricos, no puede ser 00000000000
- **Métodos:** `formatear()`, `obtenerTipoPersona()`, `equals()`
- **Tipos de persona:** Empresa (20, 23, 24, 27), Persona física (30, 33, 34)

### SituacionValueObject
- **Validaciones:** Número entero entre 0 y 9
- **Métodos:** `obtenerDescripcion()`, `esCritica()`, `esNormal()`
- **Descripciones:** Normal, Con problemas leves, Con problemas moderados, etc.

### MontoValueObject
- **Validaciones:** Número positivo, límite máximo
- **Métodos:** `formatearComoMoneda()`, `sumar()`, `esSignificativo()`
- **Formato:** Moneda argentina (ARS)

## Endpoints

### POST /deudores
Registra o actualiza un deudor.

**Body:**
```json
{
  "cuit": "20123456789",
  "situacion": 3,
  "monto": 150000
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /deudores/:cuit
Obtiene información detallada de un deudor por CUIT.

**Response:**
```json
{
  "cuit": "20123456789",
  "cuitFormateado": "20-12345678-9",
  "tipoPersona": "Empresa",
  "situacionMaxima": 5,
  "descripcionSituacion": "Irrecuperable",
  "sumaTotalPrestamos": 175000,
  "montoFormateado": "$ 175.000,00",
  "esSituacionCritica": true,
  "esMontoSignificativo": false
}
```

### GET /deudores/:cuit/resumen
Obtiene un resumen del deudor.

**Response:**
```json
{
  "cuit": "20123456789",
  "tipoPersona": "Empresa",
  "situacionMaxima": 5,
  "descripcionSituacion": "Irrecuperable",
  "sumaTotalPrestamos": 175000,
  "montoFormateado": "$ 175.000,00",
  "esSituacionCritica": true,
  "esMontoSignificativo": false
}
```

## Validaciones

### CUIT
- Debe tener exactamente 11 dígitos numéricos
- No puede ser 00000000000
- Validación automática del tipo de persona

### Situación
- Debe ser un número entero entre 0 y 9
- 0: Normal, 1-4: Problemas, 5-8: Crítica, 9: Sin información

### Monto
- Debe ser un número positivo
- Límite máximo: 999.999.999.999,99
- Formateo automático como moneda argentina

## Lógica de Negocio

- **Value Objects:** Encapsulan validaciones y lógica de negocio
- **Inmutabilidad:** Los Value Objects son inmutables
- **Enriquecimiento:** Información automática (tipo persona, descripciones, formateo)
- **Validaciones:** Centralizadas en los Value Objects
- **Métodos de negocio:** `esCritica()`, `esSignificativo()`, `formatear()`

## Próximos Pasos

1. Implementar repositorio DynamoDB
2. Agregar validaciones con class-validator
3. Implementar logging estructurado
4. Agregar tests unitarios y de integración
5. Implementar procesamiento de archivos .TXT del BCRA
6. Crear Value Objects para entidades 