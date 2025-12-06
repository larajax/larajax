<?php

namespace Larajax\Classes\AjaxResponse;

use Stringable;
use JsonSerializable;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Renderable;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Larajax\Classes\AjaxRequest;
use Larajax\Classes\AjaxHelpers;

/**
 * AjaxResponse class returned from ajax() call
 */
trait HasOverrides
{
    /**
     * request returns an AJAX Request object
     */
    public function request()
    {
        return (new AjaxRequest)->fromRequest(request());
    }

    /**
     * wrap arbitrary handler output into an AjaxResponse.
     * - Associative arrays merge into `data`
     * - Everything else lands in `data['result']`
     */
    public static function wrap($result): static
    {
        if ($result instanceof self) {
            return $result;
        }

        $response = ajax();

        if ($result instanceof RedirectResponse) {
            return $response->redirect($result);
        }

        if ($result instanceof \Symfony\Component\HttpFoundation\Response) {
            return $response->force($result);
        }

        if ($result instanceof Renderable) {
            return $response->data(['result' => $result->render()]);
        }

        if ($result instanceof Arrayable) {
            $arr = $result->toArray();
            return AjaxHelpers::isAssoc($arr)
                ? $response->data($arr)
                : $response->data(['result' => $arr]);
        }

        if ($result instanceof JsonSerializable) {
            $json = $result->jsonSerialize();
            return is_array($json) && AjaxHelpers::isAssoc($json)
                ? $response->data($json)
                : $response->data(['result' => $json]);
        }

        if (is_array($result)) {
            return AjaxHelpers::isAssoc($result)
                ? $response->dataWithUpdateSelectors($result)
                : $response->data(['result' => $result]);
        }

        if (is_string($result) || is_numeric($result) || is_bool($result) || is_null($result)) {
            return $response->data(['result' => $result]);
        }

        if ($result instanceof Stringable) {
            return $response->data(['result' => (string) $result]);
        }

        // Abort wrapping for custom responses, such as a file downloads
        return $response->force($result);
    }

    /**
     * registerGlobalComponent register a stateless component class globally
     */
    public static function registerGlobalComponent($className)
    {
        ComponentContainer::$globalComponents = array_unique([
            ...ComponentContainer::$globalComponents,
            $className
        ]);
    }
}
