<?php

namespace Larajax\Traits;

use Larajax\Classes\ComponentContainer;
use Larajax\Contracts\ViewComponentInterface;
use Exception;

/**
 * AjaxController is a trait that can be implemented in a controller class.
 */
trait AjaxController
{
    /**
     * @var componentContainer instance
     */
    protected $componentContainer;

    /**
     * handleAjaxAction
     */
    protected function callAjaxAction(string $method, array $parameters)
    {
        $this->initComponents();

        if ($this->hasAjaxHandler()) {
            return $this->runAjaxAction($method, array_values($parameters));
        }
    }

    /**
     * initComponents adds component objects to the controller
     */
    protected function initComponents()
    {
        $this->componentContainer = new ComponentContainer($this);

        $this->componentContainer->register();

        $this->componentContainer->boot();
    }

    /**
     * addComponentInstance
     */
    public function addComponentInstance(ViewComponentInterface $instance)
    {
        $this->componentContainer->bind($instance->alias, $instance);
    }

    /**
     * getComponentInstance returns an instance of a component based on its alias
     */
    public function getComponentInstance(string $alias): ViewComponentInterface
    {
        return $this->componentContainer->make($alias);
    }

    /**
     * runAjaxAction
     */
    protected function runAjaxAction($action, $parameters)
    {
        $handler = $this->getAjaxHandlerName();
        if (!$handler) {
            return;
        }

        if (!preg_match('/^on[A-Z][a-zA-Z]*$/', $handler)) {
            return ajax()->error("[{$handler}] is an invalid AJAX handler name");
        }

        $method = $this->getAjaxHandlerMethod($handler, $action);
        if (!$method) {
            return ajax()->error("AJAX handler [{$handler}] not found", 404);
        }

        try {
            return ajax()::wrap($method(...$parameters));
        }
        catch (Exception $ex) {
            return ajax()->exception($ex);
        }
    }

    /**
     * hasAjaxHandler returns true if the AJAX lifecycle should run
     */
    protected function hasAjaxHandler(): bool
    {
        return (bool) $this->getAjaxHandlerName();
    }

    /**
     * getAjaxHandlerName fetches the handler name from the request headers
     */
    protected function getAjaxHandlerName()
    {
        return preg_replace('/[^a-zA-Z0-9]/', '', (string) request()->header('X-AJAX-HANDLER'));
    }

    /**
     * getAjaxHandlerMethod returns the AJAX handler method to call in the implementing class
     */
    protected function getAjaxHandlerMethod($handler, $action)
    {
        if (method_exists($this, $actionHandler = "{$action}_{$handler}")) {
            return [$this, $actionHandler];
        }

        if (method_exists($this, $handler)) {
            return [$this, $handler];
        }

        if ($componentMethod = $this->componentContainer->getAjaxHandlerMethod($handler)) {
            return $componentMethod;
        }

        return null;
    }
}
