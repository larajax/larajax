<?php

namespace Larajax\Contracts;

/**
 * AjaxComponentInterface
 */
interface ViewComponentInterface
{
    /**
     * newInstance returns a new instance of an AJAX component
     */
    public static function createIn(AjaxControllerInterface $controller, array $config): ViewComponentInterface;

    /**
     * bindToController is called when the component has been fully prepared
     */
    public function bindToController();
}
