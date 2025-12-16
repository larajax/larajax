<?php

namespace Larajax;

use Illuminate\Support\ServiceProvider;

class LarajaxServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../resources/dist' => public_path('vendor/larajax'),
            ], 'larajax-assets');
        }
    }
}
