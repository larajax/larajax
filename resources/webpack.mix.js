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

mix.js('src/framework-bundle.js', 'dist/framework-bundle.min.js');
mix.js('src/framework-extras.js', 'dist/framework-extras.min.js');
mix.js('src/framework-turbo.js', 'dist/framework-turbo.min.js');
mix.js('src/framework.js', 'dist/framework.min.js');

if (!mix.inProduction()) {
    mix.js('src/framework-bundle.js', 'dist/framework-bundle.js');
    mix.js('src/framework-extras.js', 'dist/framework-extras.js');
    mix.js('src/framework-turbo.js', 'dist/framework-turbo.js');
    mix.js('src/framework.js', 'dist/framework.js');
}
