<?php

if (!function_exists('ajax')) {
    function ajax()
    {
        return new \October\Ajax\Classes\AjaxResponse;
    }
}
