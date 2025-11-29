<?php

namespace Larajax\Classes;

/**
 * AjaxHelpers class
 */
class AjaxHelpers
{
    /**
     * isAssoc returns true if an array is associative
     */
    public static function isAssoc(array $arr): bool
    {
        return array_keys($arr) !== range(0, count($arr) - 1);
    }

    /**
     * methodExists supports a custom methodExists function
     */
    public static function methodExists($obj, $method): bool
    {
        if (method_exists($obj, 'methodExists')) {
            return (bool) $obj->methodExists($method);
        }

        return method_exists($obj, $method);
    }
}