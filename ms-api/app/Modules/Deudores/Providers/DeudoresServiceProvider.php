<?php

namespace App\Modules\Deudores\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Deudores\Repositories\DeudorRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDeudorRepository;

class DeudoresServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(DeudorRepositoryInterface::class, EloquentDeudorRepository::class);
    }

    public function boot() {
        $this->loadRoutesFrom(__DIR__.'/../Infrastructure/Http/routes.php');
    }
}