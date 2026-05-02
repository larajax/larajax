import { describe, it, expect } from 'bun:test';
import { Location } from '../../src/turbo/location';

describe('Location', () => {
    describe('constructor', () => {
        it('stores the URL', () => {
            const loc = new Location('http://example.com/about');
            expect(loc.absoluteURL).toBe('http://example.com/about');
        });

        it('preserves an absolute URL', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.absoluteURL).toBe('http://example.com/page');
        });

        it('extracts anchor from hash', () => {
            const loc = new Location('http://example.com/page#section');
            expect(loc.anchor).toBe('section');
        });

        it('requestURL excludes anchor', () => {
            const loc = new Location('http://example.com/page#section');
            expect(loc.requestURL).toBe('http://example.com/page');
            expect(loc.requestURL).not.toContain('#');
        });

        it('requestURL equals absoluteURL when no anchor', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.requestURL).toBe(loc.absoluteURL);
        });

        it('anchor is undefined when no hash', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.anchor).toBeUndefined();
        });

        it('ignores single # with no anchor value', () => {
            const loc = new Location('http://example.com/page#');
            expect(loc.anchor).toBeUndefined();
            expect(loc.requestURL).toBe(loc.absoluteURL);
        });
    });

    describe('wrap', () => {
        it('creates Location from string', () => {
            const loc = Location.wrap('http://example.com/page');
            expect(loc).toBeInstanceOf(Location);
            expect(loc.absoluteURL).toBe('http://example.com/page');
        });

        it('returns existing Location object unchanged', () => {
            const original = new Location('http://example.com/page');
            const wrapped = Location.wrap(original);
            expect(wrapped).toBe(original);
        });

        it('returns undefined for null input', () => {
            expect(Location.wrap(null)).toBeUndefined();
        });

        it('returns undefined for undefined input', () => {
            expect(Location.wrap(undefined)).toBeUndefined();
        });
    });

    describe('getOrigin', () => {
        it('returns protocol and host', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.getOrigin()).toBe('http://example.com');
        });

        it('includes port in origin', () => {
            const loc = new Location('http://example.com:8080/page');
            expect(loc.getOrigin()).toBe('http://example.com:8080');
        });
    });

    describe('getPath', () => {
        it('returns path component', () => {
            const loc = new Location('http://example.com/foo/bar');
            expect(loc.getPath()).toBe('/foo/bar');
        });

        it('returns / for root URL', () => {
            const loc = new Location('http://example.com/');
            expect(loc.getPath()).toBe('/');
        });

        it('excludes query string', () => {
            const loc = new Location('http://example.com/page?key=value');
            expect(loc.getPath()).toBe('/page');
        });
    });

    describe('getExtension', () => {
        it('returns extension for .html', () => {
            const loc = new Location('http://example.com/page.html');
            expect(loc.getExtension()).toBe('.html');
        });

        it('returns empty string for no extension', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.getExtension()).toBe('');
        });

        it('returns extension for .json', () => {
            const loc = new Location('http://example.com/api/data.json');
            expect(loc.getExtension()).toBe('.json');
        });
    });

    describe('isHTML', () => {
        it('returns truthy for .html extension', () => {
            const loc = new Location('http://example.com/page.html');
            expect(loc.isHTML()).toBeTruthy();
        });

        it('returns truthy for .htm extension', () => {
            const loc = new Location('http://example.com/page.htm');
            expect(loc.isHTML()).toBeTruthy();
        });

        it('returns truthy for no extension', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.isHTML()).toBeTruthy();
        });

        it('returns falsy for .json extension', () => {
            const loc = new Location('http://example.com/data.json');
            expect(loc.isHTML()).toBeFalsy();
        });

        it('returns falsy for .xml extension', () => {
            const loc = new Location('http://example.com/feed.xml');
            expect(loc.isHTML()).toBeFalsy();
        });
    });

    describe('isPrefixedBy', () => {
        it('returns true when URLs are equal', () => {
            const loc = new Location('http://example.com/app');
            const prefix = new Location('http://example.com/app');
            expect(loc.isPrefixedBy(prefix)).toBe(true);
        });

        it('returns true when URL starts with prefix', () => {
            const loc = new Location('http://example.com/app/page');
            const prefix = new Location('http://example.com/app');
            expect(loc.isPrefixedBy(prefix)).toBe(true);
        });

        it('returns false when URL does not start with prefix', () => {
            const loc = new Location('http://example.com/other/page');
            const prefix = new Location('http://example.com/app');
            expect(loc.isPrefixedBy(prefix)).toBe(false);
        });
    });

    describe('isEqualTo', () => {
        it('returns true for equal absolute URLs', () => {
            const a = new Location('http://example.com/page');
            const b = new Location('http://example.com/page');
            expect(a.isEqualTo(b)).toBe(true);
        });

        it('returns false for different URLs', () => {
            const a = new Location('http://example.com/page1');
            const b = new Location('http://example.com/page2');
            expect(a.isEqualTo(b)).toBe(false);
        });

        it('returns falsy for null', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.isEqualTo(null)).toBeFalsy();
        });
    });

    describe('serialization', () => {
        it('toString returns absoluteURL', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.toString()).toBe('http://example.com/page');
        });

        it('toJSON returns absoluteURL', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.toJSON()).toBe('http://example.com/page');
        });

        it('valueOf returns absoluteURL', () => {
            const loc = new Location('http://example.com/page');
            expect(loc.valueOf()).toBe('http://example.com/page');
        });
    });
});
