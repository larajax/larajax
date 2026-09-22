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
     * make builds the component from named arguments and binds it to the current controller, 
     * or a single configuration array is also accepted
     */
    public static function make(...$config): static
    {
        if (count($config) === 1 && array_key_exists(0, $config) && is_array($config[0])) {
            $config = $config[0];
        }

        return static::makeWithConfig($config);
    }

    /**
     * makeWithConfig builds the component from a configuration array and binds
     * it to the current controller.
     */
    public static function makeWithConfig(array $config = []): static
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
     * makeFromNamedArgs builds the component from a make() override's defined
     * arguments, where nulls are treated as not supplied and extra named arguments
     * collected by the override's variadic parameter pass through as configuration.
     */
    protected static function makeFromNamedArgs(array $vars, array $extra): static
    {
        unset($vars['config']);

        $config = array_filter($vars, function ($value) {
            return $value !== null;
        });

        return static::makeWithConfig(array_merge($config, $extra));
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
