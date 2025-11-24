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
     * @var object config supplied.
     */
    public $config;

    /**
     * @var string alias defined for this widget.
     */
    public $alias;

    /**
     * @var \Backend\Classes\Controller|null controller for the backend.
     */
    protected $controller;

    /**
     * createIn controller
     */
    public static function createIn(AjaxControllerInterface $controller, array $config = []): ViewComponentInterface
    {
        $instance = new static;

        $instance->controller = $controller;

        $instance->config = $config;

        $instance->alias = $config['alias'] ?? array_reverse(explode('\\', static::class))[0];

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

        $this->controller->addComponentInstance($this);
    }
}
