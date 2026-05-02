import { describe, it, expect } from 'bun:test';
import { Page } from '../../src/turbo/page';

describe('Page', () => {
    describe('fromHTMLString', () => {
        it('parses head and body from HTML', () => {
            const html = '<head><title>Test</title></head><body><p>Content</p></body>';
            const page = Page.fromHTMLString(html);
            expect(page.bodyElement).toBeDefined();
            expect(page.bodyElement.querySelector('p').textContent).toBe('Content');
            expect(page.headDetails).toBeDefined();
        });

        it('creates empty body if none in HTML', () => {
            const html = '<head><title>Test</title></head>';
            const page = Page.fromHTMLString(html);
            expect(page.bodyElement).toBeDefined();
            expect(page.bodyElement.tagName.toLowerCase()).toBe('body');
        });
    });

    describe('fromHTMLElement', () => {
        it('parses from an existing HTML element', () => {
            const el = document.createElement('html');
            el.innerHTML = '<head><meta name="turbo-visit-control" content="enable"></head><body><div>Test</div></body>';
            const page = Page.fromHTMLElement(el);
            expect(page.bodyElement.querySelector('div').textContent).toBe('Test');
        });
    });

    describe('isViewTransitionEnabled', () => {
        it('returns true with turbo-view-transition same-origin meta', () => {
            const html = '<head><meta name="turbo-view-transition" content="same-origin"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isViewTransitionEnabled()).toBe(true);
        });

        it('returns false without the meta tag', () => {
            const html = '<head></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isViewTransitionEnabled()).toBe(false);
        });

        it('returns false with different content value', () => {
            const html = '<head><meta name="turbo-view-transition" content="cross-origin"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isViewTransitionEnabled()).toBe(false);
        });
    });

    describe('isEnabled', () => {
        it('returns true when visit-control is not disable', () => {
            const html = '<head><meta name="turbo-visit-control" content="enable"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isEnabled()).toBe(true);
        });

        it('returns false when visit-control is disable', () => {
            const html = '<head><meta name="turbo-visit-control" content="disable"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isEnabled()).toBe(false);
        });

        it('returns true when no visit-control meta', () => {
            const html = '<head></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isEnabled()).toBe(true);
        });
    });

    describe('isVisitable', () => {
        it('returns true when enabled and not reload', () => {
            const html = '<head><meta name="turbo-visit-control" content="enable"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isVisitable()).toBe(true);
        });

        it('returns false when visit-control is reload', () => {
            const html = '<head><meta name="turbo-visit-control" content="reload"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isVisitable()).toBe(false);
        });

        it('returns false when disabled', () => {
            const html = '<head><meta name="turbo-visit-control" content="disable"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isVisitable()).toBe(false);
        });
    });

    describe('isNativeError', () => {
        it('returns true when visit-control has any value', () => {
            const html = '<head><meta name="turbo-visit-control" content="enable"></head><body></body>';
            const page = Page.fromHTMLString(html);
            expect(page.isNativeError()).toBe(true);
        });

        it('returns false when no visit-control meta', () => {
            const html = '<head></head><body></body>';
            const page = Page.fromHTMLString(html);
            // getSetting returns defaultValue (false) when meta not found
            expect(page.isNativeError()).toBe(false);
        });
    });

    describe('getElementForAnchor', () => {
        it('finds element by id', () => {
            const html = '<head></head><body><div id="target">Found</div></body>';
            const page = Page.fromHTMLString(html);
            const el = page.getElementForAnchor('target');
            expect(el).toBeDefined();
            expect(el.textContent).toBe('Found');
        });

        it('finds element by a[name]', () => {
            const html = '<head></head><body><a name="section">Link</a></body>';
            const page = Page.fromHTMLString(html);
            const el = page.getElementForAnchor('section');
            expect(el).toBeDefined();
            expect(el.textContent).toBe('Link');
        });

        it('returns null for non-existent anchor', () => {
            const html = '<head></head><body><p>No anchors</p></body>';
            const page = Page.fromHTMLString(html);
            const el = page.getElementForAnchor('missing');
            expect(el).toBeNull();
        });
    });

    describe('permanent elements', () => {
        it('finds elements with data-turbo-permanent', () => {
            const html = '<head></head><body><div id="nav" data-turbo-permanent>Nav</div><div>Other</div></body>';
            const page = Page.fromHTMLString(html);
            const elements = page.getPermanentElements();
            expect(elements.length).toBe(1);
            expect(elements[0].id).toBe('nav');
        });

        it('finds permanent element by id', () => {
            const html = '<head></head><body><div id="sidebar" data-turbo-permanent>Sidebar</div></body>';
            const page = Page.fromHTMLString(html);
            const el = page.getPermanentElementById('sidebar');
            expect(el).toBeDefined();
            expect(el.id).toBe('sidebar');
        });

        it('returns null for non-permanent element', () => {
            const html = '<head></head><body><div id="content">Content</div></body>';
            const page = Page.fromHTMLString(html);
            const el = page.getPermanentElementById('content');
            expect(el).toBeNull();
        });
    });

    describe('findFirstAutofocusableElement', () => {
        it('finds element with autofocus attribute', () => {
            const html = '<head></head><body><input type="text"><input type="email" autofocus></body>';
            const page = Page.fromHTMLString(html);
            const el = page.findFirstAutofocusableElement();
            expect(el).toBeDefined();
            expect(el.getAttribute('type')).toBe('email');
        });

        it('returns null when no autofocus element', () => {
            const html = '<head></head><body><input type="text"></body>';
            const page = Page.fromHTMLString(html);
            const el = page.findFirstAutofocusableElement();
            expect(el).toBeNull();
        });
    });

    describe('getRootLocation', () => {
        it('returns root from meta tag', () => {
            const html = '<head><meta name="turbo-root" content="/app"></head><body></body>';
            const page = Page.fromHTMLString(html);
            const root = page.getRootLocation();
            expect(root.absoluteURL).toContain('/app');
        });

        it('defaults to / when no root meta', () => {
            const html = '<head></head><body></body>';
            const page = Page.fromHTMLString(html);
            const root = page.getRootLocation();
            expect(root.getPath()).toBe('/');
        });
    });
});
