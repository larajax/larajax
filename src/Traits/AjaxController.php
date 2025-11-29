<?php

namespace Larajax\Traits;

use Larajax\Exceptions\HandlerNotFound;
use Larajax\Exceptions\ComponentNotFound;
use Larajax\Exceptions\HandlerNameInvalid;
use Larajax\Classes\AjaxHelpers;
use Larajax\Classes\AjaxResponse;
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
     * callAjaxAction
     */
    protected function callAjaxAction(string $action, array $parameters)
    {
        $this->initAjaxRequest();

        if ($this->ajaxRequest->hasAjaxHandler()) {
            return $this->runAjaxAction($action, array_values($parameters));
        }
    }

    /**
     * initComponents adds component objects to the controller
     */
    protected function initAjaxRequest()
    {
        $this->ajaxRequest ??= ajax()->request();

        $this->componentContainer ??= new ComponentContainer($this);

        $this->componentContainer->register();

        $this->componentContainer->boot();
    }

    /**
     * getAjaxRequest
     */
    public function getAjaxRequest()
    {
        return $this->ajaxRequest ??= ajax()->request();
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

        $this->componentContainer ??= new ComponentContainer($this);

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
            throw new HandlerNameInvalid;
        }

        $method = $this->getAjaxHandlerMethod($action);
        if (!$method) {
            throw new HandlerNotFound;
        }

        $call = method_exists($this, 'makeCallForAjax')
            ? $this->makeCallForAjax($method, $parameters)
            : $method(...$parameters);

        $response = ajax()::wrap($call);
        if (!$response instanceof AjaxResponse) {
            return $response;
        }

        // Include partials
        if ($this->ajaxRequest->partialList && method_exists($this, 'makePartialForAjax')) {
            foreach ($this->ajaxRequest->partialList as $partial) {
                $response->partial($partial, $this->makePartialForAjax($partial));
            }
        }

        return $response;
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

            throw new ComponentNotFound;
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
