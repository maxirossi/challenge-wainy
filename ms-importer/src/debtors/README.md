# Módulo Debtors - Arquitectura DDD

Este módulo implementa la gestión de deudores siguiendo los principios de Domain-Driven Design (DDD).

## Estructura

```
src/debtors/
├── domain/
│   ├── debtor.entity.ts          # Entidad de dominio
│   └── debtor.repository.ts      # Interfaz del repositorio
├── infrastructure/
│   └── repositories/
│       └── in-memory-debtor.repository.ts  # Implementación en memoria
├── application/
│   └── use-cases/
│       ├── register-debtor.usecase.ts      # Caso de uso: registrar deudor
│       └── get-debtor.usecase.ts           # Caso de uso: obtener deudor
├── dto/
│   └── register-debtor.dto.ts    # Data Transfer Object
├── debtors.controller.ts         # Controlador REST
└── debtors.module.ts             # Módulo NestJS
```

## Endpoints

### POST /debtors
Registra o actualiza un deudor.

**Body:**
```json
{
  "cuit": "20123456789",
  "situation": 3,
  "amount": 150000
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /debtors/:cuit
Obtiene información de un deudor por CUIT.

**Response:**
```json
{
  "cuit": "20123456789",
  "maxSituation": 5,
  "totalLoans": 175000
}
```

## Validaciones

- **CUIT**: Debe tener exactamente 11 dígitos numéricos
- **Situation**: Número entero que representa la situación del deudor
- **Amount**: Número que representa el monto del préstamo

## Lógica de Negocio

- Si el deudor no existe, se crea uno nuevo
- Si el deudor existe, se actualiza su `maxSituation` (máximo entre el actual y el nuevo) y se suma el `amount` al `totalLoans`
- El `maxSituation` siempre mantiene el valor más alto registrado

## Próximos Pasos

1. Implementar repositorio DynamoDB
2. Agregar validaciones con class-validator
3. Implementar logging estructurado
4. Agregar tests unitarios y de integración 