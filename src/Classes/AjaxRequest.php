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
     * ENVELOPE_KEY is the reserved request-metadata key, stripped before dispatch.
     */
    const ENVELOPE_KEY = '__ajax';

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
     * @var array|null envelope holds the parsed request envelope, or null if absent
     */
    public $envelope;

    /**
     * fromRequest
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function fromRequest($request): static
    {
        $this->request = $request;

        $this->envelope = $this->parseEnvelope();

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

    /**
     * parseEnvelope returns the request envelope metadata, or null if none was sent.
     */
    protected function parseEnvelope(): ?array
    {
        $envelope = $this->request->input(self::ENVELOPE_KEY);

        return is_array($envelope) ? $envelope : null;
    }

    /**
     * hasEnvelope returns true when the request carried envelope metadata.
     */
    public function hasEnvelope(): bool
    {
        return $this->envelope !== null;
    }

    /**
     * applyEnvelope strips the request envelope and restores JSON key order for bulk data.
     */
    public function applyEnvelope(): void
    {
        if (!$this->hasEnvelope()) {
            return;
        }

        // Strip the envelope so it never reaches validation or handlers.
        $input = $this->request->except(self::ENVELOPE_KEY);

        foreach ($this->envelope['orders'] ?? [] as $order) {
            $path = $order['path'] ?? null;
            $keys = $order['keys'] ?? null;

            if (is_array($path) && is_array($keys)) {
                $this->applyKeyOrder($input, $path, $keys);
            }
        }

        // Write back to the bag the read path uses (JSON body for bulk requests).
        if ($this->request->isJson()) {
            $this->request->json()->replace($input);
        }

        $this->request->replace($input);
    }

    /**
     * applyKeyOrder rebuilds the container at the segment path to follow the given key order.
     */
    protected function applyKeyOrder(array &$input, array $path, array $keys): void
    {
        $target = &$input;

        foreach ($path as $segment) {
            if (!is_array($target) || !array_key_exists($segment, $target)) {
                return;
            }

            $target = &$target[$segment];
        }

        if (!is_array($target)) {
            return;
        }

        $ordered = [];

        // Manifest keys first, in order.
        foreach ($keys as $key) {
            if (array_key_exists($key, $target)) {
                $ordered[$key] = $target[$key];
            }
        }

        // Then any keys the manifest did not cover.
        foreach ($target as $key => $value) {
            if (!array_key_exists($key, $ordered)) {
                $ordered[$key] = $value;
            }
        }

        $target = $ordered;
    }
}
