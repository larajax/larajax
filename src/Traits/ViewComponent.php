<?php

namespace Larajax\Traits;

use Exception;
use Larajax\Contracts\AjaxControllerInterface;
use Larajax\Contracts\ViewComponentInterface;

/**
 * ViewComponent is a trait that can be implemented in a component...
 * or this should be class itself
 */
trait ViewComponent
{
    /**
     * @var array config supplied.
     */
    public $config;

    /**
     * @var string alias defined for this widget.
     */
    public $alias;

    /**
     * @var AjaxControllerInterface|null controller object.
     */
    public $controller;

    /**
     * make builds the component and binds it to the current controller
     */
    public static function make(array $config = []): static
    {
        if (!app()->bound('larajax.controller')) {
            throw new Exception(
                "[".static::class."::make()] can only be called from inside a Larajax controller action. ".
                "From other contexts use ".static::class."::createIn(\$host, \$config)->bindToController()."
            );
        }

        $instance = static::createIn(app('larajax.controller'), $config);

        $instance->bindToController();

        return $instance;
    }

    /**
     * createIn builds a component instance against the given controller,
     * wires up its controller/config/alias, and invokes the component's
     * optional register() hook.
     */
    public static function createIn(AjaxControllerInterface $controller, array $config = []): ViewComponentInterface
    {
        $instance = new static;

        $instance->controller = $controller;

        $instance->config = $config;

        $instance->alias = $config['alias'] ?? array_reverse(explode('\\', static::class))[0];

        if (method_exists($instance, 'register')) {
            $instance->register();
        }

        return $instance;
    }

    /**
     * bindToController
     */
    public function bindToController()
    {
        if (!$this->controller) {
            throw new Exception("Component [".static::class."] has no controller specified.");
        }

        $this->controller->addComponentInstance($this->alias, $this);
    }
}
