<?php

namespace Larajax\Classes\AjaxResponse;

use Larajax\Classes\AjaxRequest;
use Larajax\Classes\ComponentContainer;

/**
 * AjaxResponse class returned from ajax() call
 */
trait HasOverrides
{
    /**
     * request returns an AJAX Request object
     */
    public function request()
    {
        return (new AjaxRequest)->fromRequest(request());
    }

    /**
     * registerCustomResponse
     */
    public static function registerCustomResponse($className)
    {
        app()->bind(\Larajax\Classes\AjaxResponse::class, $className);
    }

    /**
     * registerGlobalComponent register a stateless component class globally
     */
    public static function registerGlobalComponent($className)
    {
        ComponentContainer::$globalComponents = array_unique([
            ...ComponentContainer::$globalComponents,
            $className
        ]);
    }
}
