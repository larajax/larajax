<?php

namespace Larajax\Classes;

/**
 * ComponentContainer
 */
class ComponentContainer
{
    /**
     * @var object controller instance
     */
    protected $controller;

    /**
     * @var array
     */
    protected $componentData = [
        'components' => []
    ];

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
            !property_exists($this->controller, 'components') ||
            !is_array($this->controller->components)
        ) {
            return;
        }

        foreach ($this->controller->components as $componentClass) {
            $componentClass::createIn($this->controller)->bindToController();
        }
    }

    /**
     * bootComponents initializes all the components
     */
    public function boot()
    {
        foreach ($this->componentData['components'] as $componentObj) {
            $componentObj->init();
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
            if (method_exists($component, $handler)) {
                return [$component, $handler];
            }
        }
    }
}
