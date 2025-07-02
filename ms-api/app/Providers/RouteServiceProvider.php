<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        // RateLimiter::for('api', function (Request $request) {
        //     return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        // });

        $this->routes(function () {
            // Rutas de API estándar
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            // Rutas web estándar
            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            // Rutas DDD - buscar en módulos si existen
            // $this->loadDDDRoutes();
        });
    }

    /**
     * Cargar rutas de la arquitectura DDD
     */
    private function loadDDDRoutes(): void
    {
        // Buscar archivos de rutas en la estructura DDD
        $dddRoutesPath = base_path('app/Domains');
        
        if (is_dir($dddRoutesPath)) {
            $domains = glob($dddRoutesPath . '/*', GLOB_ONLYDIR);
            
            foreach ($domains as $domain) {
                $domainName = basename($domain);
                $routesPath = $domain . '/Infrastructure/Http/routes';
                
                // Cargar rutas de API del dominio
                $apiRoutesFile = $routesPath . '/api.php';
                if (file_exists($apiRoutesFile)) {
                    Route::middleware('api')
                        ->prefix('api')
                        ->group($apiRoutesFile);
                }
                
                // Cargar rutas web del dominio
                $webRoutesFile = $routesPath . '/web.php';
                if (file_exists($webRoutesFile)) {
                    Route::middleware('web')
                        ->group($webRoutesFile);
                }
            }
        }
    }
} 