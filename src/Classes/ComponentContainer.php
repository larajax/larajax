<?php

namespace Larajax\Classes;

use IteratorAggregate;
use Traversable;
use ArrayIterator;

/**
 * ComponentContainer
 */
class ComponentContainer implements IteratorAggregate
{
    /**
     * @var object controller instance
     */
    protected $controller;

    /**
     * @var array componentData
     */
    protected $componentData = [
        'components' => []
    ];

    /**
     * @var array globalComponents
     */
    public static $globalComponents = [];

    /**
     * @var bool registered indicates that register() has already run, so
     * declared and global components are not re-instantiated on repeat
     * calls (e.g. nested dispatch).
     */
    protected $registered = false;

    /**
     * @var bool booted indicates that boot() has already run.
     */
    protected $booted = false;

    /**
     * __construct
     */
    public function __construct($controller)
    {
        $this->controller = $controller;
    }

    /**
     * register registers component references from a controller. Idempotent:
     * subsequent calls are no-ops, so it is safe to call from dispatch paths
     * that may run more than once per request (e.g. nested dispatch).
     */
    public function register()
    {
        if ($this->registered) {
            return;
        }

        $this->registered = true;

        if (
            property_exists($this->controller, 'components') &&
            is_array($this->controller->components)
        ) {
            foreach ($this->controller->components as $componentClass) {
                $componentClass::createIn($this->controller)->bindToController();
            }
        }

        foreach (static::$globalComponents as $componentClass) {
            $componentClass::createIn($this->controller)->bindToController();
        }
    }

    /**
     * boot invokes the boot() hook on every registered component.
     */
    public function boot()
    {
        if ($this->booted) {
            return;
        }

        $this->booted = true;

        foreach ($this->componentData['components'] as $componentObj) {
            if (method_exists($componentObj, 'boot')) {
                $componentObj->boot();
            }
        }
    }

    /**
     * bind adds a component instance to the page.
     */
    public function bind(string $alias, object $instance)
    {
        $this->componentData['components'][$alias] = $instance;

        // Register dependencies
        if (property_exists($instance, 'components') && is_array($instance->components)) {
            foreach ($instance->components as $componentClass) {
                $componentClass::createIn($this->controller)->bindToController();
            }
        }

        if ($this->booted && method_exists($instance, 'boot')) {
            $instance->boot();
        }
    }

    /**
     * make returns an instance of a component based on its alias
     */
    public function make(string $alias)
    {
        return $this->componentData['components'][$alias] ?? null;
    }

    /**
     * getAjaxHandlerMethod looks for a AJAX handler in a component
     */
    public function getAjaxHandlerMethod($handler)
    {
        foreach ($this->componentData['components'] as $component) {
            if (AjaxHelpers::methodExists($component, $handler)) {
                return [$component, $handler];
            }
        }

        return null;
    }

    /**
     * __get to dynamically access components.
     * @param  string  $key
     * @return mixed
     */
    public function __get($key)
    {
        return $this->make($key);
    }

    /**
     * getIterator returns an iterator for the components.
     */
    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->componentData['components']);
    }
}
