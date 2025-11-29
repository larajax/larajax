<?php

namespace Larajax\Classes;

/**
 * AjaxRequest class
 */
class AjaxRequest
{
    const HEADER_HANDLER = 'X-AJAX-HANDLER';
    const HEADER_FLASH = 'X-AJAX-FLASH';
    const HEADER_PARTIAL = 'X-AJAX-PARTIAL';
    const HEADER_PARTIALS = 'X-AJAX-PARTIALS';

    /**
     * @var string handler
     */
    public $handler;

    /**
     * @var string qualifiedHandler
     */
    public $qualifiedHandler;

    /**
     * @var string component
     */
    public $component;

    /**
     * @var bool wantsFlash
     */
    public $wantsFlash;

    /**
     * @var string partial for capture mode
     */
    public $partial;

    /**
     * @var array partialList requested
     */
    public $partialList;

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

        [$this->component, $this->handler] = $this->getAjaxHandlerName();

        $this->qualifiedHandler = $this->component ? "{$this->component}::{$this->handler}" : $this->handler;

        $this->partial = $this->getAjaxPartialName();

        $this->partialList = $this->getAjaxHandlerPartialList();

        $this->wantsFlash = (bool) $this->request->header(self::HEADER_FLASH);

        return $this;
    }

    /**
     * hasAjaxHandler
     */
    public function hasAjaxHandler(): bool
    {
        if (!$this->request->ajax() || $this->request->method() !== 'POST') {
            return false;
        }

        if (!preg_match('/^(?:\w+\:{2})?on[A-Z]{1}[\w+]*$/', $this->handler)) {
            return false;
        }

        return true;
    }

    /**
     * getAjaxHandlerName fetches the handler name from the request headers
     */
    protected function getAjaxHandlerName(): array
    {
        $handler = $this->request->header(self::HEADER_HANDLER);
        if (!$handler || !is_string($handler)) {
            return ['', ''];
        }

        if (strpos($handler, '::')) {
            $parts = explode('::', $handler, 2);
            return [trim($parts[0]), trim($parts[1])];
        }

        return ['', trim($handler)];
    }

    /**
     * getAjaxPartialName returns a partial name or true
     */
    protected function getAjaxPartialName()
    {
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
}
