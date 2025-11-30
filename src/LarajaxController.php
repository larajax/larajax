<?php

namespace Larajax;

use Illuminate\Routing\Controller;
use Larajax\Contracts\AjaxControllerInterface;
use Exception;

/**
 * LarajaxController is a basic implementation of Larajax in a Laravel controller
 */
class LarajaxController extends Controller implements AjaxControllerInterface
{
    use \Larajax\Traits\AjaxController;

    /**
     * callAction injects AJAX handlers in to controller actions
     */
    public function callAction($action, $parameters)
    {
        try {
            if ($result = $this->callAjaxAction($action, array_values($parameters))) {
                return $result;
            }
        }
        catch (Exception $ex) {
            return ajax()->exception($ex);
        }

        return parent::callAction($action, $parameters);
    }
}
