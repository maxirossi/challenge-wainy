#!/bin/bash

# Script para borrar solo los datos principales (sin tablas del sistema)
# Mantiene la estructura de las tablas, solo borra los datos

# No usar set -e para evitar que se detenga en errores menores
# set -e

echo "🧹 Iniciando limpieza de datos principales..."
echo "============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si los containers están corriendo
check_containers() {
    print_status "Verificando que los containers estén corriendo..."
    
    if ! docker ps | grep -q "mysql"; then
        print_error "Container MySQL no está corriendo"
        exit 1
    fi
    
    if ! docker ps | grep -q "localstack"; then
        print_error "Container LocalStack no está corriendo"
        exit 1
    fi
    
    print_success "Containers verificados"
}

# Limpiar tablas de DynamoDB
clear_dynamodb_tables() {
    print_status "Limpiando tablas de DynamoDB..."
    
    # Lista de tablas de DynamoDB
    TABLES=("importaciones_bcra" "deudores_bcra" "importaciones_errores")
    
    for table in "${TABLES[@]}"; do
        print_status "Limpiando tabla: $table"
        
        # Verificar si la tabla existe
        TABLE_EXISTS=$(docker exec localstack awslocal dynamodb list-tables --query "TableNames[?contains(@, '$table')]" --output text 2>/dev/null || echo "")
        
        if [ -z "$TABLE_EXISTS" ]; then
            print_warning "Tabla $table no existe en DynamoDB"
            continue
        fi
        
        # Obtener todos los items de la tabla de forma más robusta
        ITEMS=$(docker exec localstack awslocal dynamodb scan \
            --table-name "$table" \
            --attributes-to-get "id" "cuit" \
            --query "Items[*].[id.S,cuit.S]" \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$ITEMS" ] && [ "$ITEMS" != "None" ]; then
            # Contar items antes de borrar
            ITEM_COUNT=$(echo "$ITEMS" | wc -l)
            print_status "Encontrados $ITEM_COUNT items en $table"
            
            # Borrar cada item
            echo "$ITEMS" | while read -r id cuit; do
                if [ -n "$id" ] && [ "$id" != "None" ]; then
                    docker exec localstack awslocal dynamodb delete-item \
                        --table-name "$table" \
                        --key "{\"id\":{\"S\":\"$id\"}}" >/dev/null 2>&1 || true
                fi
                if [ -n "$cuit" ] && [ "$cuit" != "None" ]; then
                    docker exec localstack awslocal dynamodb delete-item \
                        --table-name "$table" \
                        --key "{\"cuit\":{\"S\":\"$cuit\"}}" >/dev/null 2>&1 || true
                fi
            done
            print_success "Tabla $table limpiada ($ITEM_COUNT items eliminados)"
        else
            print_warning "Tabla $table ya está vacía"
        fi
    done
}

# Limpiar tablas principales de MySQL
clear_mysql_tables() {
    print_status "Limpiando tablas principales de MySQL..."
    
    # Solo las tablas principales de datos (sin tablas del sistema)
    TABLES=("deudores" "entidades_financieras")
    
    for table in "${TABLES[@]}"; do
        print_status "Limpiando tabla: $table"
        
        # Verificar si la tabla existe antes de intentar limpiarla
        TABLE_EXISTS=$(docker exec mysql mysql -u wayni_user -psecret wayni -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep -c "$table" || echo "0")
        
        if [ "$TABLE_EXISTS" -gt 0 ]; then
            # Contar registros antes de limpiar
            COUNT=$(docker exec mysql mysql -u wayni_user -psecret wayni -e "SELECT COUNT(*) FROM $table;" 2>/dev/null | tail -n 1 || echo "0")
            
            if [ "$COUNT" -gt 0 ]; then
                # Limpiar la tabla
                docker exec mysql mysql -u wayni_user -psecret wayni -e "DELETE FROM $table;" 2>/dev/null || true
                print_success "Tabla $table limpiada ($COUNT registros eliminados)"
            else
                print_warning "Tabla $table ya está vacía"
            fi
        else
            print_warning "Tabla $table no existe"
        fi
    done
}

# Función principal
main() {
    echo "🚀 Iniciando proceso de limpieza de datos principales..."
    echo ""
    
    # Verificar containers
    check_containers
    
    echo ""
    
    # Limpiar DynamoDB
    print_status "=== LIMPIANDO DYNAMODB ==="
    clear_dynamodb_tables
    
    echo ""
    
    # Limpiar MySQL
    print_status "=== LIMPIANDO MYSQL (TABLAS PRINCIPALES) ==="
    clear_mysql_tables
    
    echo ""
    print_success "✅ Limpieza completada exitosamente!"
    print_status "Todas las tablas principales han sido limpiadas manteniendo su estructura"
}

# Ejecutar función principal
main "$@" 