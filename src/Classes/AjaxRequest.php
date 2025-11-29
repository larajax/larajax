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
class AjaxRequest
{
    const HEADER_HANDLER = 'X-AJAX-HANDLER';
    const HEADER_FLASH = 'X-AJAX-FLASH';
    const HEADER_PARTIAL = 'X-AJAX-PARTIAL';
    const HEADER_PARTIALS = 'X-AJAX-PARTIALS';

    /**
     * @var bool isAjax valid with a valid handler name
     */
    public $isAjax;

    /**
     * @var string handler
     */
    public $handler;

    /**
     * @var bool wantsFlash
     */
    public $wantsFlash;

    /**
     * @var string partial for capture mode
     */
    public $partial;

    /**
     * @var array partials requested
     */
    public $partials;

    /**
     * @var \Illuminate\Http\Request request base instance
     */
    public $request;

    /**
     * fromRequest
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function fromRequest($request): static
    {
        $this->request = $request;

        $this->handler = $this->getAjaxHandlerName();

        $this->partial = $this->getAjaxPartialName();

        $this->partials = $this->getAjaxHandlerPartialList();

        $this->wantsFlash = (bool) $this->request->header(self::HEADER_FLASH);

        $this->isAjax = $this->isAjaxValid();

        return $this;
    }

    /**
     * getAjaxHandlerName fetches the handler name from the request headers
     */
    protected function getAjaxHandlerName()
    {
        return preg_replace(
            '/[^a-zA-Z0-9]/',
            '',
            (string) $this->request->header(self::HEADER_HANDLER)
        );
    }

    /**
     * getAjaxPartialName returns a partial name or true
     */
    protected function getAjaxPartialName()
    {
        if (!$this->request->ajax() || $this->request->method() !== 'POST') {
            return null;
        }

        if ($ajaxPartial = $this->request->header(self::HEADER_PARTIAL)) {
            return $ajaxPartial;
        }

        return null;
    }

    /**
     * getAjaxHandlerPartialList
     */
    protected function getAjaxHandlerPartialList(): array
    {
        $partialList = $this->request->header(self::HEADER_PARTIALS);

        if ($partialList && ($partialList = trim($partialList))) {
            return explode('&', $partialList);
        }

        return [];
    }

    /**
     * isAjaxValid
     */
    protected function isAjaxValid(): bool
    {
        if (!preg_match('/^on[A-Z][a-zA-Z]*$/', $this->handler)) {
            return false;
        }

        return true;
    }
}