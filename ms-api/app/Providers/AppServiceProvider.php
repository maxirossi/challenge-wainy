<?php

namespace App\Providers;

use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDeudorRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentEntidadFinancieraRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bindings para repositorios
        $this->app->bind(DeudorRepositoryInterface::class, EloquentDeudorRepository::class);
        $this->app->bind(EntidadFinancieraRepositoryInterface::class, EloquentEntidadFinancieraRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
