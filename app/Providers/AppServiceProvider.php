<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register route middleware alias for role checking if Router is available
        try {
            $router = $this->app->make('\Illuminate\Routing\Router');
            $router->aliasMiddleware('role', \App\Http\Middleware\RoleMiddleware::class);
        } catch (\Throwable $e) {
            // In some artisan contexts the router may not be available; ignore registration in that case.
        }
    }

    
}
