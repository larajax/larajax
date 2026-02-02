<?php

namespace Larajax\Classes;

use Stringable;
use JsonSerializable;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Renderable;
use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * AjaxResponse class returned from ajax() call
 */
class AjaxResponse implements Responsable
{
    use \Larajax\Classes\AjaxResponse\HasOverrides;
    use \Larajax\Classes\AjaxResponse\HasAccessors;

    const SEVERITY_INFO = 'info';
    const SEVERITY_ERROR = 'error';
    const SEVERITY_FATAL = 'fatal';

    const OP_FLASH = 'flash';
    const OP_PATCH_DOM = 'patchDom';
    const OP_PARTIAL = 'partial';
    const OP_REDIRECT = 'redirect';
    const OP_RELOAD = 'reload';
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
     * @var mixed responseOverride from a forced response.
     */
    protected $responseOverride = null;

    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        if ($this->responseOverride !== null) {
            return $this->responseOverride;
        }

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
     * update adds DOM updates to the AJAX response.
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
     * redirect adds a browser redirect to the AJAX response.
     */
    public function redirect($location): static
    {
        if ($location instanceof RedirectResponse) {
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
     * redirect adds a browser refresh command to the response
     */
    public function reload(): static
    {
        $this->ajaxData['content']['ops'][] = [
            'op' => self::OP_RELOAD,
        ];

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
     * error adds an error message to the AJAX response.
     */
    public function error(string $message = '', $status = 400): static
    {
        $this->ajaxData['content']['ok'] = false;

        $this->ajaxData['content']['severity'] = self::SEVERITY_ERROR;

        $this->ajaxData['status'] = $status;

        $this->ajaxData['content']['message'] = $message;

        return $this;
    }

    /**
     * fatal adds a fatal error message to the AJAX response.
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
     * js adds a JavaScript file or files to load with the output.
     *
     * Usage:
     *   ajax()->js('path/to/file.js')
     *   ajax()->js('path/to/file.js', ['type' => 'module'])
     *   ajax()->js(['path/to/file1.js', 'path/to/file2.js'])
     *   ajax()->js([
     *       'path/to/file1.js' => ['type' => 'module'],
     *       'path/to/file2.js' => ['defer' => true],
     *   ])
     */
    public function js(string|array $paths, array $attributes = []): static
    {
        return $this->asset('js', $paths, $attributes);
    }

    /**
     * css adds a StyleSheet file or files to load with the output.
     *
     * Usage:
     *   ajax()->css('path/to/file.css')
     *   ajax()->css('path/to/file.css', ['media' => 'print'])
     *   ajax()->css(['path/to/file1.css', 'path/to/file2.css'])
     *   ajax()->css([
     *       'path/to/file1.css' => ['media' => 'screen'],
     *       'path/to/file2.css' => ['media' => 'print'],
     *   ])
     */
    public function css(string|array $paths, array $attributes = []): static
    {
        return $this->asset('css', $paths, $attributes);
    }

    /**
     * img adds an image file or files to load with the output.
     *
     * Usage:
     *   ajax()->img('path/to/image.jpg')
     *   ajax()->img(['path/to/image1.jpg', 'path/to/image2.jpg'])
     */
    public function img(string|array $paths, array $attributes = []): static
    {
        return $this->asset('img', $paths, $attributes);
    }

    /**
     * Adds an asset file or files to load with the output.
     *
     * Supported types: js, css, img
     *
     * The $paths parameter can be:
     * - A string: single path
     * - A sequential array: list of paths (no attributes)
     * - An associative array: path => attributes mapping
     *
     * The $attributes parameter applies to all paths when $paths is a string
     * or sequential array.
     */
    public function asset(string $type, string|array $paths, array $attributes = []): static
    {
        if (!$paths) {
            return $this;
        }

        // Normalize to array of {url, attributes} objects
        $assets = $this->normalizeAssetPaths($paths, $attributes);

        $this->ajaxData['content']['ops'][] = [
            'op' => self::OP_LOAD_ASSETS,
            'type' => $type,
            'assets' => $assets,
        ];

        return $this;
    }

    /**
     * Normalizes asset paths into a consistent format.
     *
     * Returns strings for paths without attributes (smaller payload),
     * or {url, attributes} objects when attributes are present.
     *
     * @return array Array of strings or ['url' => string, 'attributes' => array]
     */
    protected function normalizeAssetPaths(string|array $paths, array $attributes = []): array
    {
        // Single string path
        if (is_string($paths)) {
            return $attributes ? [['url' => $paths, 'attributes' => $attributes]] : [$paths];
        }

        $assets = [];

        foreach ($paths as $key => $value) {
            // Associative: path => attributes
            if (is_string($key)) {
                $attrs = is_array($value) ? $value : [];
                $assets[] = $attrs ? ['url' => $key, 'attributes' => $attrs] : $key;
            }
            // Sequential: just a path string
            else {
                $assets[] = $attributes ? ['url' => $value, 'attributes' => $attributes] : $value;
            }
        }

        return $assets;
    }

    /**
     * browserEvent adds browser event dispatch with the AJAX response.
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
     * invalidFields adds invalid form fields to the AJAX response.
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
     * invalidField adds a single invalid form field to the AJAX response.
     */
    public function invalidField($field, $messages)
    {
        return $this->invalidFields([$field => $messages]);
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
     * Handles a generic exception including validation errors.
     */
    public function exception($exception): static
    {
        if ($exception instanceof \Larajax\Contracts\AjaxExceptionInterface) {
            return $this->error()->data($exception->toAjaxData());
        }

        if ($exception instanceof \Illuminate\Validation\ValidationException) {
            return $this->error($exception->getMessage())->invalidFields($exception->errors());
        }

        if ($exception instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
            return $this->error('Access Denied');
        }

        if ($exception instanceof \Illuminate\Database\QueryException) {
            return $this->fatal($exception->getMessage());
        }

        if ($exception instanceof \Exception) {
            return $this->error($exception->getMessage());
        }

        // Throwable but not Exception (i.e., Error)
        return $this->fatal($exception->getMessage());
    }

    /**
     * force bypasses an AJAX response entirely for a custom one
     */
    public function force($response): static
    {
        $this->responseOverride = $response;

        return $this;
    }

    /**
     * headers
     */
    public function headers(array $headers): static
    {
        $this->ajaxData['headers'] = [
            ...$headers,
            ...($this->ajaxData['headers'] ?? [])
        ];

        return $this;
    }

    /**
     * dataWithUpdateSelectors converts partial update shortcuts to updates
     */
    public function dataWithUpdateSelectors(array $dataAndUpdates): static
    {
        $data = $dataAndUpdates;
        $updates = [];
        $selectors = ['#', '.', '@', '^', '!', '='];
        $modifiers = [
            '@' => 'append',
            '^' => 'prepend',
            '!' => 'replace',
            '=' => 'innerHTML'
        ];

        foreach ($data as $target => $content) {
            foreach ($selectors as $selector) {
                if (str_starts_with($target, $selector)) {
                    unset($data[$target]);

                    if (isset($modifiers[$selector])) {
                        $target = substr($target, 1);
                    }

                    $updates[] = [
                        'target' => $target,
                        'content' => $content,
                        'swap' => $modifiers[$selector] ?? 'innerHTML'
                    ];
                }
            }
        }

        return $this->data($data)->update($updates);
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
}
