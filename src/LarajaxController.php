<?php

namespace Larajax;

use Illuminate\Routing\Controller;
use Larajax\Contracts\AjaxControllerInterface;

/**
 * LarajaxController is a basic implementation of Larajax in a Laravel
 * controller. It is intentionally minimal: a reference example showing how
 * the AjaxController trait wires into a host. Apply the same pattern to
 * your own base controller class to opt in to Larajax dispatch.
 */
class LarajaxController extends Controller implements AjaxControllerInterface
{
    use \Larajax\Traits\AjaxController;

    /**
     * callAction delegates to the AjaxController trait, passing a closure
     * that invokes the parent action.
     */
    public function callAction($action, $parameters)
    {
        return $this->dispatchAjaxAction($action, $parameters, function ($action, $parameters) {
            return parent::callAction($action, $parameters);
        });
    }
}