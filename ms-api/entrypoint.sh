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

echo "🔧 Ejecutando seeders..."
php artisan db:seed --force

echo "🚀 Iniciando servidor web..."
echo "📡 Iniciando PHP SQS Listener en background..."

# Iniciar el listener PHP de SQS en background
/var/www/wait-and-start-listener.sh &
LISTENER_PID=$!

echo "✅ PHP SQS Listener iniciado con PID: $LISTENER_PID"

# Función para limpiar al salir
cleanup() {
    echo "🛑 Deteniendo PHP SQS Listener..."
    if [ ! -z "$LISTENER_PID" ]; then
        kill $LISTENER_PID 2>/dev/null || true
    fi
    exit 0
}

# Capturar señales para limpiar
trap cleanup SIGTERM SIGINT

echo "🌐 Iniciando servidor web en puerto 8000..."
php artisan serve --host=0.0.0.0 --port=8000
