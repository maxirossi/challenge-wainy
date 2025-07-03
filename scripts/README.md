# Scripts de Limpieza de Datos

Este directorio contiene scripts para limpiar los datos de las bases de datos durante las pruebas.

## Scripts Disponibles

### 1. `clear-all-data.sh`
**Limpia TODAS las tablas** (incluyendo tablas del sistema)

- **DynamoDB**: `importaciones_bcra`, `deudores_bcra`, `importaciones_errores`
- **MySQL**: `deudores`, `entidades_financieras`, `sessions`, `password_reset_tokens`, `cache`, `cache_locks`

### 2. `clear-main-data.sh` ⭐ **RECOMENDADO**
**Limpia solo las tablas principales de datos** (sin tablas del sistema)

- **DynamoDB**: `importaciones_bcra`, `deudores_bcra`, `importaciones_errores`
- **MySQL**: `deudores`, `entidades_financieras`

## Uso

### Prerrequisitos
- Los containers de Docker deben estar corriendo:
  - `mysql` (MySQL 8.4)
  - `localstack` (DynamoDB local)

### Ejecutar Scripts

```bash
# Limpiar solo datos principales (RECOMENDADO para pruebas)
./scripts/clear-main-data.sh

# Limpiar todas las tablas (incluyendo sistema)
./scripts/clear-all-data.sh
```

### Ejemplo de Flujo de Trabajo para Video

```bash
# 1. Iniciar los containers
docker-compose up -d

# 2. Esperar a que estén listos
sleep 30

# 3. Limpiar datos para empezar limpio
./scripts/clear-main-data.sh

# 4. Ejecutar pruebas de carga
# ... tus pruebas aquí ...

# 5. Limpiar datos para la siguiente prueba
./scripts/clear-main-data.sh

# 6. Repetir pasos 4-5 según necesites
```

## Características de los Scripts

- ✅ **Verificación de containers**: Verifica que MySQL y LocalStack estén corriendo
- ✅ **Manejo de errores**: Continúa aunque algunas tablas no existan
- ✅ **Output colorido**: Mensajes claros con colores para mejor legibilidad
- ✅ **Conteo de registros**: Muestra cuántos registros se eliminaron
- ✅ **Seguro**: Solo borra datos, NO elimina la estructura de las tablas
- ✅ **Idempotente**: Se puede ejecutar múltiples veces sin problemas

## Notas Importantes

- Los scripts **NO eliminan** la estructura de las tablas, solo los datos
- Los scripts **NO eliminan** las tablas del sistema (a menos que uses `clear-all-data.sh`)
- Los scripts verifican que los containers estén corriendo antes de ejecutar
- Si una tabla no existe, el script mostrará una advertencia y continuará

## Troubleshooting

### Error: "Container MySQL no está corriendo"
```bash
# Verificar que los containers estén corriendo
docker ps

# Si no están corriendo, iniciarlos
docker-compose up -d
```

### Error: "Tabla no existe"
- Es normal si las migraciones no se han ejecutado aún
- Ejecuta las migraciones primero: `docker exec ms-api php artisan migrate`

### Error de permisos
```bash
# Hacer los scripts ejecutables
chmod +x scripts/*.sh
``` 