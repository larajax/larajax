<?php

namespace Larajax\Contracts;

/**
 * AjaxControllerInterface
 */
interface AjaxControllerInterface
{
    /**
     * addComponentInstance registers a component instance with the controller
     */
    public function addComponentInstance(ViewComponentInterface $instance);

    /**
     * getComponentInstance returns a component instance attached to the controller
     */
    public function getComponentInstance(string $alias): ViewComponentInterface;
}
