#!/bin/bash

set -e

# Función para esperar a que MySQL esté disponible
wait_for_mysql() {
    echo "⏳ Esperando a que MySQL esté disponible..."
    
    # Obtener configuración de la base de datos desde .env o usar valores por defecto
    DB_HOST=${DB_HOST:-mysql}
    DB_PORT=${DB_PORT:-3306}
    DB_USERNAME=${DB_USERNAME:-root}
    DB_PASSWORD=${DB_PASSWORD:-root}
    
    until mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --silent; do
        echo "⏳ MySQL no está listo aún... esperando 5 segundos"
        sleep 5
    done
    
    echo "✅ MySQL está listo!"
}

echo "🔧 Instalando dependencias de Laravel..."
composer install --no-interaction

echo "⏳ Esperando a que MySQL esté disponible..."
wait_for_mysql

echo "🔧 Ejecutando migraciones..."
php artisan migrate --force

echo "🚀 Iniciando múltiples workers de Laravel para mejor rendimiento..."
# Iniciar múltiples workers en paralelo para mejor throughput
php artisan queue:work --daemon --sleep=3 --tries=3 --max-time=3600 --memory=512 --timeout=300 &
php artisan queue:work --daemon --sleep=3 --tries=3 --max-time=3600 --memory=512 --timeout=300 &
php artisan queue:work --daemon --sleep=3 --tries=3 --max-time=3600 --memory=512 --timeout=300 &

echo "🚀 Iniciando Laravel en modo serve..."
php artisan serve --host=0.0.0.0 --port=8000
