<?php

namespace Larajax\Traits;

use Larajax\Exceptions\HandlerNotFound;
use Larajax\Exceptions\HandlerNameInvalid;
use Larajax\Classes\AjaxHelpers;
use Larajax\Classes\ComponentContainer;
use Larajax\Contracts\ViewComponentInterface;
use Exception;

/**
 * AjaxController is a trait that can be implemented in a controller class.
 */
trait AjaxController
{
    /**
     * @var AjaxRequest ajaxRequest
     */
    protected $ajaxRequest;

    /**
     * @var ComponentContainer componentContainer instance
     */
    protected $componentContainer;

    /**
     * handleAjaxAction
     */
    protected function callAjaxAction(string $method, array $parameters)
    {
        $this->initAjaxRequest();

        if ($this->ajaxRequest->hasAjaxHandler()) {
            return $this->runAjaxAction($method, array_values($parameters));
        }
    }

    /**
     * initComponents adds component objects to the controller
     */
    protected function initAjaxRequest()
    {
        $this->ajaxRequest = ajax()->request();

        $this->componentContainer = new ComponentContainer($this);

        $this->componentContainer->register();

        $this->componentContainer->boot();
    }

    /**
     * addComponentInstance
     */
    public function addComponentInstance(string $alias, ViewComponentInterface $instance)
    {
        if (!$instance->controller) {
            $instance->controller = $this;
        }

        if (!$instance->alias) {
            $instance->alias = $alias;
        }

        $this->componentContainer->bind($alias, $instance);
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
        $handler = $this->ajaxRequest->handler;
        if (!$handler) {
            return;
        }

        if (!preg_match('/^on[A-Z][a-zA-Z]*$/', $handler)) {
            // return ajax()->error("[{$handler}] is an invalid AJAX handler name");
            throw new HandlerNameInvalid;
        }

        $method = $this->getAjaxHandlerMethod($action);
        if (!$method) {
            // return ajax()->error("AJAX handler [{$handler}] not found", 404);
            throw new HandlerNotFound;
        }

        try {
            return ajax()::wrap($method(...$parameters));
        }
        catch (Exception $ex) {
            return ajax()->exception($ex);
        }
    }

    /**
     * getAjaxHandlerMethod returns the AJAX handler method to call in the implementing class
     */
    protected function getAjaxHandlerMethod($action)
    {
        $handler = $this->ajaxRequest->handler;
        if (!$handler) {
            return null;
        }

        if ($component = $this->ajaxRequest->component) {
            if ($componentObj = $this->componentContainer->make($component)) {
                return [$componentObj, $handler];
            }

            return null;
        }

        if (AjaxHelpers::methodExists($this, $actionHandler = "{$action}_{$handler}")) {
            return [$this, $actionHandler];
        }

        if (AjaxHelpers::methodExists($this, $handler)) {
            return [$this, $handler];
        }

        if ($componentMethod = $this->componentContainer->getAjaxHandlerMethod($handler)) {
            return $componentMethod;
        }

        return null;
    }
}
