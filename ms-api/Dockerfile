FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    zip unzip curl git libpq-dev libzip-dev libonig-dev libxml2-dev \
    default-mysql-client \
    && docker-php-ext-install pdo_mysql

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .
COPY sqs-listener.php /var/www/html/sqs-listener.php

RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

RUN composer install
RUN [ ! -f .env ] && cp .env.example .env || true
RUN php artisan key:generate

CMD ["php-fpm"]
