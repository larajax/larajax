<?php

namespace Larajax\Tests\Classes;

use Illuminate\Http\Request;
use Larajax\Classes\AjaxRequest;
use PHPUnit\Framework\TestCase;

class AjaxRequestHandlerNameTest extends TestCase
{
    /**
     * makeRequest builds a request carrying the given handler header.
     */
    protected function makeRequest(string $handler, string $method = 'POST', bool $isAjax = true): Request
    {
        $server = [
            'REQUEST_METHOD' => $method,
            'HTTP_X_AJAX_HANDLER' => $handler,
        ];

        if ($isAjax) {
            $server['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';
        }

        return new Request(server: $server);
    }

    public function testValidHandlerNames(): void
    {
        $names = [
            'onSave',
            'onA',
            'onSave2',
            'onSave_draft',
            'alias::onSave',
            'my_alias::onSave',
            'alias2::onSave2',
        ];

        foreach ($names as $name) {
            $this->assertTrue(AjaxRequest::isValidHandlerName($name), $name);
        }
    }

    public function testInvalidHandlerNames(): void
    {
        $names = [
            '',
            'on',
            'onsave',
            'save',
            'posts',
            'alias::posts',
            'alias::',
            '::onSave',
            'my-alias::onSave',
            'a::b::onSave',
            'onFoo+bar',
            'onFoo-bar',
            "onSave\n",
            ' onSave',
            '__construct',
        ];

        foreach ($names as $name) {
            $this->assertFalse(AjaxRequest::isValidHandlerName($name), json_encode($name));
        }
    }

    public function testRequestWithValidHandler(): void
    {
        $ajaxRequest = (new AjaxRequest)->fromRequest($this->makeRequest('onSave'));

        $this->assertTrue($ajaxRequest->hasAjaxHandler());
        $this->assertSame('onSave', $ajaxRequest->qualifiedHandler);
    }

    public function testRequestWithComponentHandler(): void
    {
        $ajaxRequest = (new AjaxRequest)->fromRequest($this->makeRequest('alias::onSave'));

        $this->assertTrue($ajaxRequest->hasAjaxHandler());
        $this->assertSame('alias', $ajaxRequest->component);
        $this->assertSame('onSave', $ajaxRequest->handler);
    }

    public function testRequestWithInvalidHandler(): void
    {
        $this->assertFalse((new AjaxRequest)->fromRequest($this->makeRequest('posts'))->hasAjaxHandler());
        $this->assertFalse((new AjaxRequest)->fromRequest($this->makeRequest('alias::posts'))->hasAjaxHandler());
        $this->assertFalse((new AjaxRequest)->fromRequest($this->makeRequest(''))->hasAjaxHandler());
    }

    public function testRequestMustBeAjaxPost(): void
    {
        $this->assertFalse((new AjaxRequest)->fromRequest($this->makeRequest('onSave', 'GET'))->hasAjaxHandler());
        $this->assertFalse((new AjaxRequest)->fromRequest($this->makeRequest('onSave', 'POST', false))->hasAjaxHandler());
    }
}
