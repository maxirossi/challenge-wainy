#!/bin/bash

set -e

echo "🔧 Instalando dependencias de Laravel..."
composer install --no-interaction

echo "🔧 Ejecutando migraciones..."
php artisan migrate --force

echo "🚀 Iniciando Laravel en modo serve..."
php artisan serve --host=0.0.0.0 --port=8000
