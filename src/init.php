<?php

if (!function_exists('ajax')) {
    function ajax()
    {
        return app(Larajax\Classes\AjaxResponse::class);
    }
}
