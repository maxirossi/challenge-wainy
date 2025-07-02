# Módulo Deudores - Arquitectura DDD

Este módulo implementa la gestión de deudores siguiendo los principios de Domain-Driven Design (DDD).

## Estructura

```
src/deudores/
├── domain/
│   ├── deudor.entity.ts          # Entidad de dominio
│   └── deudor.repository.ts      # Interfaz del repositorio
├── infrastructure/
│   └── repositories/
│       └── in-memory-deudor.repository.ts  # Implementación en memoria
├── application/
│   └── use-cases/
│       ├── registrar-deudor.usecase.ts      # Caso de uso: registrar deudor
│       └── obtener-deudor.usecase.ts        # Caso de uso: obtener deudor
├── dto/
│   └── registrar-deudor.dto.ts    # Data Transfer Object
├── deudores.controller.ts         # Controlador REST
└── deudores.module.ts             # Módulo NestJS
```

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
Obtiene información de un deudor por CUIT.

**Response:**
```json
{
  "cuit": "20123456789",
  "situacionMaxima": 5,
  "sumaTotalPrestamos": 175000
}
```

## Validaciones

- **CUIT**: Debe tener exactamente 11 dígitos numéricos
- **Situación**: Número entero que representa la situación del deudor
- **Monto**: Número que representa el monto del préstamo

## Lógica de Negocio

- Si el deudor no existe, se crea uno nuevo
- Si el deudor existe, se actualiza su `situacionMaxima` (máximo entre el actual y el nuevo) y se suma el `monto` al `sumaTotalPrestamos`
- El `situacionMaxima` siempre mantiene el valor más alto registrado

## Próximos Pasos

1. Implementar repositorio DynamoDB
2. Agregar validaciones con class-validator
3. Implementar logging estructurado
4. Agregar tests unitarios y de integración
5. Implementar procesamiento de archivos .TXT del BCRA 