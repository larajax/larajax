<?php

namespace Larajax\Classes;

use Stringable;
use JsonSerializable;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Renderable;
use Illuminate\Contracts\Support\Responsable;

/**
 * AjaxResponse class returned from ajax() call
 */
class AjaxResponse implements Responsable
{
    const SEVERITY_INFO = 'info';
    const SEVERITY_ERROR = 'error';
    const SEVERITY_FATAL = 'fatal';

    const OP_FLASH = 'flash';
    const OP_PATCH_DOM = 'patchDom';
    const OP_PARTIAL = 'partial';
    const OP_REDIRECT = 'redirect';
    const OP_DISPATCH = 'dispatch';
    const OP_LOAD_ASSETS = 'loadAssets';

    /**
     * @var array
     */
    protected $ajaxData = [
        'headers' => [
            'X-AJAX-RESPONSE' => true
        ],
        'status' => 200,
        'content' => [
            'ok' => true,
            'severity' => 'info',
            'message' => null,
            'data' => [],
            'invalid' => [],
            'ops' => [],
            'redirect' => null
        ],
    ];

    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $env = $this->ajaxData['content'];
        $data = $env['data'];
        unset($env['data']);

        return response([
                ...$data,
                '__ajax' => $env
            ],
            $this->ajaxData['status'],
            $this->ajaxData['headers']
        );
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

        if ($result instanceof Renderable) {
            return $response->data(['result' => $result->render()]);
        }

        if ($result instanceof Arrayable) {
            $arr = $result->toArray();
            return self::isAssoc($arr) ? $response->data($arr) : $response->data(['result' => $arr]);
        }

        if ($result instanceof JsonSerializable) {
            $json = $result->jsonSerialize();
            return is_array($json) && self::isAssoc($json)
                ? $response->data($json)
                : $response->data(['result' => $json]);
        }

        if (is_array($result)) {
            return self::isAssoc($result)
                ? $response->data($result)
                : $response->data(['result' => $result]);
        }

        if (is_string($result) || is_numeric($result) || is_bool($result) || is_null($result)) {
            return $response->data(['result' => $result]);
        }

        if ($result instanceof Stringable) {
            return $response->data(['result' => (string) $result]);
        }

        // Abort wrapping for custom responses, such as a file downloads
        return $result;
    }

    /**
     * Handles a generic exception including validation errors.
     */
    public function exception($exception)
    {
        if ($exception instanceof \Illuminate\Validation\ValidationException) {
            return $this->invalidFields($exception->errors());
        }

        if ($exception instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
            return $this->error('Access Denied');
        }

        return $this->error($exception->getMessage());
    }

    /**
     * data adds response data to the AJAX response.
     */
    public function data(array $data): static
    {
        $this->ajaxData['content']['data'] = array_replace(
            $this->ajaxData['content']['data'] ?? [],
            $data
        );

        return $this;
    }

    /**
     * Adds an error message to the AJAX response.
     */
    public function error(string $message, $status = 400): static
    {
        $this->ajaxData['content']['ok'] = false;

        $this->ajaxData['content']['severity'] = self::SEVERITY_ERROR;

        $this->ajaxData['status'] = $status;

        $this->ajaxData['content']['message'] = $message;

        return $this;
    }

    /**
     * Adds an error message to the AJAX response.
     */
    public function fatal(string $message, $status = 500): static
    {
        $this->ajaxData['content']['ok'] = false;

        $this->ajaxData['content']['severity'] = self::SEVERITY_FATAL;

        $this->ajaxData['status'] = $status;

        $this->ajaxData['content']['message'] = $message;

        return $this;
    }

    /**
     * Adds a single invalid form field to the AJAX response.
     */
    public function invalidField($field, $messages)
    {
        return $this->invalidFields([$field => $messages]);
    }

    /**
     * Adds invalid form fields to the AJAX response.
     *
     * The array format for `errors`:
     *
     *     fieldName => [message1, message2]
     */
    public function invalidFields(array $errors): static
    {
        $this->ajaxData['status'] = 422;

        $this->ajaxData['content']['ok'] = false;

        $this->ajaxData['content']['severity'] = self::SEVERITY_ERROR;

        $invalid = (array) ($this->ajaxData['content']['invalid'] ?? []);

        // Normalize to arrays
        foreach ($errors as $field => $messages) {
            $invalid[$field] = array_values((array) $messages);
        }

        $this->ajaxData['content']['invalid'] = $invalid;

        return $this;
    }

    /**
     * flash adds flash messages to the response
     */
    public function flash(string $level, string $text): static
    {
        $this->ajaxData['content']['ops'][] = [
            'op' => self::OP_FLASH,
            'level' => $level,
            'text' => $text
        ];

        return $this;
    }

    /**
     * redirect adds a browser redirect to the AJAX response.
     */
    public function redirect($location): static
    {
        if ($location instanceof \Symfony\Component\HttpFoundation\RedirectResponse) {
            $location = $location->getTargetUrl();
        }

        $this->ajaxData['content']['ops'][] = [
            'op' => self::OP_REDIRECT,
            'url' => $location
        ];

        $this->ajaxData['content']['redirect'] = $location;

        return $this;
    }

    /**
     * partial provides a requested partial response to the browser.
     */
    public function partial(string $name, $content): static
    {
        $this->ajaxData['content']['ops'][] = [
            'op' => self::OP_PARTIAL,
            'name' => $name,
            'html' => $this->normalizeRenderable($content),
        ];

        return $this;
    }

    /**
     * partials provides multiple requested partial responses to the browser.
     */
    public function partials(array $partials): static
    {
        foreach ($partials as $name => $content) {
            $this->partial($name, $content);
        }

        return $this;
    }

    /**
     * Adds DOM updates to the AJAX response.
     *
     * The array format for `updates`:
     *
     *     target => '#myElement', content => '<div></div>', swap: 'innerHTML'
     *
     * Swap types that can be used for the `swap` array key:
     *
     * - innerHTML: Sets the content of the target element.
     * - outerHTML: Replaces the target element entirely.
     * - append: Inserts content at the end of the target element.
     * - beforeend: Inserts content at the end of the target element (same as append).
     * - afterend: Inserts content immediately after the target element.
     * - beforebegin: Inserts content before the target element.
     * - prepend: Inserts content at the beginning of the target element.
     * - afterbegin: Inserts content at the beginning of the target element (same as prepend).
     * - replace: Completely replaces the target element with the content.
     */
    public function update(array $updates): static
    {
        foreach ($updates as $target => $update) {
            if (!is_array($update)) {
                $update = ['content' => $update];
            }

            $update['target'] = $update['target'] ?? $target;

            $update['content'] = $this->normalizeRenderable($update['content'] ?? '');

            $this->ajaxData['content']['ops'][] = [
                'op' => self::OP_PATCH_DOM,
                'selector' => $update['target'],
                'html' => $update['content'],
                'swap' => $update['swap'] ?? 'innerHTML',
            ];
        }

        return $this;
    }

    /**
     * Adds browser event dispatch with the AJAX response.
     */
    public function browserEvent(string $name, $data)
    {
        $this->browserEventInternal($name, $data, false);

        return $this;
    }

    /**
     * Adds asynchronous browser event dispatch with the AJAX response.
     */
    public function browserEventAsync(string $name, $data)
    {
        $this->browserEventInternal($name, $data, true);

        return $this;
    }

    /**
     * Adds a JavaScript file or files to load with the output.
     */
    public function js(string|array $paths): static
    {
        return $this->asset('js', $paths);
    }

    /**
     * Adds a StyleSheet file or files to load with the output.
     */
    public function css(string|array $paths): static
    {
        return $this->asset('css', $paths);
    }

    /**
     * Adds an image file or files to load with the output.
     */
    public function img(string|array $paths): static
    {
        return $this->asset('img', $paths);
    }

    /**
     * Adds an asset file or files to load with the output.
     *
     * Supported types: js, css, img
     */
    public function asset(string $type, string|array $paths): static
    {
        $this->ajaxData['content']['ops'][] = [
            'op' => self::OP_LOAD_ASSETS,
            'type' => $type,
            'urls' => $paths,
        ];

        return $this;
    }

    /**
     * browserEventInternal
     */
    protected function browserEventInternal(string $name, $data, $isAsync = false)
    {
        $event = [
            'op' => self::OP_DISPATCH,
            'event' => $name,
            'detail' => $data,
            'async' => $isAsync
        ];

        $this->ajaxData['content']['ops'][] = $event;
    }

    /**
     * normalizeRenderable is an internal method to turn strings / Renderable into HTML.
     */
    protected function normalizeRenderable($content): string
    {
        if ($content instanceof \Illuminate\Contracts\Support\Renderable) {
            return $content->render();
        }

        if ($content instanceof \Stringable) {
            return (string) $content;
        }

        return is_string($content) ? $content : '';
    }

    /**
     * isAssoc returns true if an array is associative
     */
    protected static function isAssoc(array $arr): bool
    {
        return array_keys($arr) !== range(0, count($arr) - 1);
    }
}
