<?php

namespace App\Modules\Deudores\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Deudores\Repositories\DeudorRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDeudorRepository;
use Illuminate\Support\Facades\Route;

class DeudoresServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(DeudorRepositoryInterface::class, EloquentDeudorRepository::class);
    }

    public function boot() {
        // Cargar rutas con prefijo api/deudores
        Route::middleware('api')->prefix('api/deudores')->group(function () {
            $this->loadRoutesFrom(__DIR__.'/../Infrastructure/Http/routes.php');
        });
    }
}