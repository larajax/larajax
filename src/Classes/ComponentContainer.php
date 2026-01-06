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
     * __construct
     */
    public function __construct($controller)
    {
        $this->controller = $controller;
    }

    /**
     * register registers component references from a controller
     */
    public function register()
    {
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
     * bootComponents initializes all the components
     */
    public function boot()
    {
        foreach ($this->componentData['components'] as $componentObj) {
            if (method_exists($componentObj, 'boot')) {
                $componentObj->boot();
            }
        }
    }

    /**
     * bind adds a component instance to the page
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
