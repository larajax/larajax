<?php

namespace Larajax\Contracts;

/**
 * AjaxExceptionInterface
 */
interface AjaxExceptionInterface
{
    /**
     * toAjaxData
     */
    public function toAjaxData(): array;
}
