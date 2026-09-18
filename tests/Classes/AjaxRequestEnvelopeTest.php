<?php

namespace Larajax\Tests\Classes;

use Illuminate\Http\Request;
use Larajax\Classes\AjaxRequest;
use PHPUnit\Framework\TestCase;

class AjaxRequestEnvelopeTest extends TestCase
{
    /**
     * makeRequest builds a JSON POST request carrying the given decoded body.
     */
    protected function makeRequest(array $body): Request
    {
        return new Request(
            query: [],
            request: $body,
            attributes: [],
            cookies: [],
            files: [],
            server: ['CONTENT_TYPE' => 'application/json', 'REQUEST_METHOD' => 'POST'],
            content: json_encode($body)
        );
    }

    /**
     * normalize parses then applies the envelope, as the dispatch path does,
     * then returns the resulting request input.
     */
    protected function normalize(array $body): array
    {
        $request = $this->makeRequest($body);

        (new AjaxRequest)->fromRequest($request)->applyEnvelope();

        return $request->all();
    }

    public function testParsingDoesNotMutateInput(): void
    {
        // fromRequest() only parses; the input is untouched until applyEnvelope().
        $request = $this->makeRequest([
            'items' => ['16' => ['label' => 'BBB'], '17' => ['label' => 'AAA']],
            '__ajax' => [
                'orders' => [
                    ['path' => ['items'], 'keys' => ['17', '16']],
                ],
            ],
        ]);

        $ajaxRequest = (new AjaxRequest)->fromRequest($request);

        $this->assertTrue($ajaxRequest->hasEnvelope());
        $this->assertSame(['16', '17'], array_map('strval', array_keys($request->input('items'))));
        $this->assertArrayHasKey('__ajax', $request->all());

        $ajaxRequest->applyEnvelope();

        $this->assertSame(['17', '16'], array_map('strval', array_keys($request->input('items'))));
        $this->assertArrayNotHasKey('__ajax', $request->all());
    }

    public function testRestoresIntendedKeyOrderForIntegerKeyedObjects(): void
    {
        // Wire order is ascending (16,17,19); the manifest carries the true order (17,16,19).
        $result = $this->normalize([
            'items' => [
                '16' => ['label' => 'BBB'],
                '17' => ['label' => 'AAA'],
                '19' => ['label' => 'CCC'],
            ],
            '__ajax' => [
                'orders' => [
                    ['path' => ['items'], 'keys' => ['17', '16', '19']],
                ],
            ],
        ]);

        $this->assertSame(['17', '16', '19'], array_map('strval', array_keys($result['items'])));
        $this->assertSame(['AAA', 'BBB', 'CCC'], array_column($result['items'], 'label'));
    }

    public function testHandlesNestedContainerPaths(): void
    {
        $result = $this->normalize([
            'record' => [
                'items' => [
                    '16' => ['label' => 'BBB'],
                    '17' => ['label' => 'AAA'],
                ],
            ],
            '__ajax' => [
                'orders' => [
                    ['path' => ['record', 'items'], 'keys' => ['17', '16']],
                ],
            ],
        ]);

        $this->assertSame(['17', '16'], array_map('strval', array_keys($result['record']['items'])));
        $this->assertSame(['AAA', 'BBB'], array_column($result['record']['items'], 'label'));
    }

    public function testStripsEnvelopeFromInput(): void
    {
        $result = $this->normalize([
            'items' => ['16' => ['label' => 'BBB'], '17' => ['label' => 'AAA']],
            '__ajax' => [
                'orders' => [
                    ['path' => ['items'], 'keys' => ['17', '16']],
                ],
            ],
        ]);

        $this->assertArrayNotHasKey('__ajax', $result);
    }

    public function testAppendsKeysMissingFromManifest(): void
    {
        // Manifest omits key 19; it must survive, after the ordered keys.
        $result = $this->normalize([
            'items' => [
                '16' => ['label' => 'BBB'],
                '17' => ['label' => 'AAA'],
                '19' => ['label' => 'CCC'],
            ],
            '__ajax' => [
                'orders' => [
                    ['path' => ['items'], 'keys' => ['17', '16']],
                ],
            ],
        ]);

        $this->assertSame(['17', '16', '19'], array_map('strval', array_keys($result['items'])));
    }

    public function testIgnoresManifestKeysNotPresent(): void
    {
        // Manifest names key 99 that does not exist; it must be skipped, not injected.
        $result = $this->normalize([
            'items' => ['16' => ['label' => 'BBB'], '17' => ['label' => 'AAA']],
            '__ajax' => [
                'orders' => [
                    ['path' => ['items'], 'keys' => ['17', '99', '16']],
                ],
            ],
        ]);

        $this->assertSame(['17', '16'], array_map('strval', array_keys($result['items'])));
    }

    public function testIgnoresUnresolvablePath(): void
    {
        // Path points at a container that does not exist; input is left untouched.
        $result = $this->normalize([
            'items' => ['16' => ['label' => 'BBB'], '17' => ['label' => 'AAA']],
            '__ajax' => [
                'orders' => [
                    ['path' => ['missing', 'items'], 'keys' => ['17', '16']],
                ],
            ],
        ]);

        $this->assertSame(['16', '17'], array_map('strval', array_keys($result['items'])));
        $this->assertArrayNotHasKey('__ajax', $result);
    }

    public function testIsNoOpWithoutEnvelope(): void
    {
        $result = $this->normalize([
            'name' => 'Jane',
            'items' => ['16' => ['label' => 'BBB'], '17' => ['label' => 'AAA']],
        ]);

        $this->assertSame('Jane', $result['name']);
        $this->assertArrayHasKey('items', $result);
    }

    public function testMalformedOrderEntriesAreSkipped(): void
    {
        // Entries missing path/keys, or with non-array values, must not throw.
        $result = $this->normalize([
            'items' => ['16' => ['label' => 'BBB'], '17' => ['label' => 'AAA']],
            '__ajax' => [
                'orders' => [
                    ['keys' => ['17', '16']],
                    ['path' => ['items']],
                    ['path' => 'items', 'keys' => ['17', '16']],
                    'not-an-array',
                ],
            ],
        ]);

        $this->assertArrayNotHasKey('__ajax', $result);
        $this->assertArrayHasKey('items', $result);
    }
}
