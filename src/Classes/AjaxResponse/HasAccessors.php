<?php

namespace Larajax\Classes\AjaxResponse;

use Larajax\Classes\AjaxResponse;

/**
 * Accessor methods for AjaxResponse
 */
trait HasAccessors
{
    /**
     * Check if the response is successful (ok = true).
     */
    public function isOk(): bool
    {
        return $this->ajaxData['content']['ok'] === true;
    }

    /**
     * Check if the response has an error (severity is error or fatal).
     */
    public function isError(): bool
    {
        return in_array($this->ajaxData['content']['severity'], [
            AjaxResponse::SEVERITY_ERROR,
            AjaxResponse::SEVERITY_FATAL
        ], true);
    }

    /**
     * Check if the response has a fatal error.
     */
    public function isFatal(): bool
    {
        return $this->ajaxData['content']['severity'] === AjaxResponse::SEVERITY_FATAL;
    }

    /**
     * Check if the response contains a redirect.
     */
    public function isRedirect(): bool
    {
        return $this->ajaxData['content']['redirect'] !== null;
    }

    /**
     * Check if a message is set.
     */
    public function hasMessage(): bool
    {
        return $this->ajaxData['content']['message'] !== null;
    }

    /**
     * Get the redirect URL if set.
     */
    public function getRedirectUrl(): ?string
    {
        return $this->ajaxData['content']['redirect'];
    }

    /**
     * Get the response data array.
     */
    public function getData(): array
    {
        return $this->ajaxData['content']['data'] ?? [];
    }

    /**
     * Get the response message.
     */
    public function getMessage(): ?string
    {
        return $this->ajaxData['content']['message'];
    }

    /**
     * Get the severity level.
     */
    public function getSeverity(): string
    {
        return $this->ajaxData['content']['severity'];
    }

    /**
     * Get the HTTP status code.
     */
    public function getStatusCode(): int
    {
        return $this->ajaxData['status'];
    }

    /**
     * Get the response headers.
     */
    public function getHeaders(): array
    {
        return $this->ajaxData['headers'] ?? [];
    }

    /**
     * Check if any operations are queued.
     */
    public function hasOps(): bool
    {
        return !empty($this->ajaxData['content']['ops']);
    }

    /**
     * Get the operations array.
     */
    public function getOps(): array
    {
        return $this->ajaxData['content']['ops'] ?? [];
    }

    /**
     * Check if validation errors exist.
     */
    public function hasInvalidFields(): bool
    {
        return !empty($this->ajaxData['content']['invalid']);
    }

    /**
     * Get the invalid fields array.
     */
    public function getInvalidFields(): array
    {
        return $this->ajaxData['content']['invalid'] ?? [];
    }

    /**
     * Check if the response has been forced/overridden.
     */
    public function isForced(): bool
    {
        return $this->responseOverride !== null;
    }
}
