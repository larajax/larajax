<?php

namespace Larajax\Traits;

use Closure;
use Larajax\Exceptions\HandlerNotFound;
use Larajax\Exceptions\ComponentNotFound;
use Larajax\Exceptions\HandlerNameInvalid;
use Larajax\Classes\AjaxHelpers;
use Larajax\Classes\AjaxResponse;
use Larajax\Classes\ComponentContainer;
use Larajax\Contracts\ViewComponentInterface;
use Throwable;

/**
 * AjaxController is a trait that adds Larajax AJAX dispatch capabilities to
 * a host controller class.
 */
trait AjaxController
{
    /**
     * @var \Larajax\Classes\AjaxRequest ajaxRequest is the parsed AJAX request
     */
    protected $ajaxRequest;

    /**
     * @var ComponentContainer componentContainer holds the registered view components
     */
    protected $componentContainer;

    /**
     * dispatchAjaxAction is the main entry point for Larajax dispatch.
     *
     * On AJAX requests, the action's return value is discarded; only the side effects
     * of running it (component bindings, authorization, etc.) are kept.
     */
    protected function dispatchAjaxAction(string $action, array $parameters, Closure $invokeAction)
    {
        return $this->withAjaxControllerContext(function () use ($action, $parameters, $invokeAction) {
            try {
                $this->initAjaxComponents();

                $viewResponse = $invokeAction($action, $parameters);

                if ($result = $this->callAjaxAction($action, $parameters)) {
                    return $result;
                }
            }
            catch (Throwable $ex) {
                if (request()->ajax()) {
                    return ajax()->exception($ex);
                }

                throw $ex;
            }

            return $viewResponse;
        });
    }

    /**
     * callAjaxAction initializes the AJAX request and component container, then dispatches
     * to the resolved handler if the incoming request carries one.
     */
    protected function callAjaxAction(string $action, array $parameters)
    {
        $this->ajaxRequest ??= ajax()->request();

        if ($this->ajaxRequest->hasAjaxHandler()) {
            return $this->runAjaxAction($action, $parameters);
        }
    }

    /**
     * getAjaxRequest returns the parsed AJAX request, constructing it on first access.
     */
    public function getAjaxRequest()
    {
        return $this->ajaxRequest ??= ajax()->request();
    }

    /**
     * initAjaxComponents ensures the component container is constructed and booted.
     */
    protected function initAjaxComponents()
    {
        $this->componentContainer ??= new ComponentContainer($this);

        $this->componentContainer->register();

        $this->componentContainer->boot();
    }

    /**
     * addComponentInstance binds a view component to this controller under the given alias.
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
     * getComponentInstance returns the bound component for the given alias, or null if
     * no component is registered under that name.
     */
    public function getComponentInstance(string $alias): ?ViewComponentInterface
    {
        return $this->componentContainer->make($alias);
    }

    /**
     * runAjaxAction validates the requested handler name, resolves it to a callable via
     * getAjaxHandlerMethod(), invokes it, and wraps the result as an AJAX response.
     */
    protected function runAjaxAction($action, $parameters)
    {
        $handler = $this->ajaxRequest->handler;
        if (!$handler) {
            return;
        }

        if (!preg_match('/^on[A-Z][a-zA-Z]*$/', $handler)) {
            throw new HandlerNameInvalid("[{$handler}] is an invalid AJAX handler name");
        }

        $method = $this->getAjaxHandlerMethod($action);
        if (!$method) {
            throw new HandlerNotFound("AJAX handler [{$handler}] not found");
        }

        $call = method_exists($this, 'makeCallForAjax')
            ? $this->makeCallForAjax($method, $parameters)
            : app()->call($method, $parameters);

        $response = ajax()::wrap($call);

        // Include partials
        if ($this->ajaxRequest->partialList && method_exists($this, 'makePartialForAjax')) {
            foreach ($this->ajaxRequest->partialList as $partial) {
                $response->partial($partial, $this->makePartialForAjax($partial));
            }
        }

        return $response;
    }

    /**
     * getAjaxHandlerMethod resolves the AJAX handler name to a [object, method] callable,
     * or null if no match is found.
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

            throw new ComponentNotFound("Component name [{$component}] not found");
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

    /**
     * withAjaxControllerContext registers this controller as the current Larajax host
     * under 'larajax.controller' for the duration of the callback, then restores the
     * previous binding (or clears it).
     */
    protected function withAjaxControllerContext(Closure $callback)
    {
        $previous = app()->bound('larajax.controller')
            ? app('larajax.controller')
            : null;

        app()->instance('larajax.controller', $this);

        try {
            return $callback();
        }
        finally {
            if ($previous !== null) {
                app()->instance('larajax.controller', $previous);
            }
            else {
                app()->forgetInstance('larajax.controller');
            }
        }
    }
}
