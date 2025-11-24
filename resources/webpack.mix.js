const mix = require('laravel-mix');
const webpackConfig = require('./webpack.config');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your theme assets. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix
    .webpackConfig(webpackConfig)
    .options({
        manifest: false,
    });

mix.js('resources/src/framework-bundle.js', 'resources/dist/framework-bundle.min.js');
mix.js('resources/src/framework-extras.js', 'resources/dist/framework-extras.min.js');
mix.js('resources/src/framework-turbo.js', 'resources/dist/framework-turbo.min.js');
mix.js('resources/src/framework.js', 'resources/dist/framework.min.js');

if (!mix.inProduction()) {
    mix.js('resources/src/framework-bundle.js', 'resources/dist/framework-bundle.js');
    mix.js('resources/src/framework-extras.js', 'resources/dist/framework-extras.js');
    mix.js('resources/src/framework-turbo.js', 'resources/dist/framework-turbo.js');
    mix.js('resources/src/framework.js', 'resources/dist/framework.js');
}
