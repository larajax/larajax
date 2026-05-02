import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Options } from '../../src/request/options';

describe('Options', () => {
    describe('constructor validation', () => {
        it('throws when handler is empty', () => {
            expect(() => new Options('', {})).toThrow(/handler name is not specified/);
        });

        it('throws when handler is null', () => {
            expect(() => new Options(null, {})).toThrow(/handler name is not specified/);
        });

        it('throws for invalid handler format', () => {
            expect(() => new Options('invalidHandler', {})).toThrow(/Invalid handler name/);
        });

        it('accepts valid handler with on prefix', () => {
            expect(() => new Options('onSubmit', {})).not.toThrow();
        });

        it('accepts namespaced handler', () => {
            expect(() => new Options('MyComponent::onSubmit', {})).not.toThrow();
        });
    });

    describe('getRequestOptions', () => {
        it('returns POST method', () => {
            const result = Options.fetch('onTest', {});
            expect(result.method).toBe('POST');
        });

        it('uses window.location.href when no url option', () => {
            const result = Options.fetch('onTest', {});
            expect(result.url).toBe(window.location.href);
        });

        it('uses custom url option', () => {
            const result = Options.fetch('onTest', { url: '/custom' });
            expect(result.url).toBe('/custom');
        });
    });

    describe('buildHeaders', () => {
        it('includes X-Requested-With header', () => {
            const result = Options.fetch('onTest', {});
            expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest');
        });

        it('includes X-AJAX-HANDLER header', () => {
            const result = Options.fetch('onTest', {});
            expect(result.headers['X-AJAX-HANDLER']).toBe('onTest');
        });

        it('sets form-urlencoded content type by default', () => {
            const result = Options.fetch('onTest', {});
            expect(result.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        });

        it('sets json content type for bulk mode', () => {
            const result = Options.fetch('onTest', { bulk: true });
            expect(result.headers['Content-Type']).toBe('application/json');
        });

        it('omits content type for file uploads', () => {
            const result = Options.fetch('onTest', { files: true });
            expect(result.headers['Content-Type']).toBeUndefined();
        });

        it('includes flash header when requested', () => {
            const result = Options.fetch('onTest', { flash: true });
            expect(result.headers['X-AJAX-FLASH']).toBe(1);
        });

        it('includes partial header', () => {
            const result = Options.fetch('onTest', { partial: 'myPartial' });
            expect(result.headers['X-AJAX-PARTIAL']).toBe('myPartial');
        });

        it('merges custom headers', () => {
            const result = Options.fetch('onTest', {
                headers: { 'X-Custom': 'value' }
            });
            expect(result.headers['X-Custom']).toBe('value');
            expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest');
        });
    });

    describe('extractPartials', () => {
        it('extracts partial names from update map', () => {
            const opts = new Options('onTest', {});
            const result = opts.extractPartials({ sidebar: true, header: '#hdr' });
            expect(result).toBe('sidebar&header');
        });

        it('replaces _self with selfPartial value', () => {
            const opts = new Options('onTest', {});
            const result = opts.extractPartials({ _self: true, other: '#el' }, 'myPartial');
            expect(result).toContain('myPartial');
            expect(result).not.toContain('_self');
        });

        it('returns empty string for empty update', () => {
            const opts = new Options('onTest', {});
            expect(opts.extractPartials({})).toBe('');
        });

        it('returns empty string for undefined update', () => {
            const opts = new Options('onTest', {});
            expect(opts.extractPartials(undefined)).toBe('');
        });
    });

    describe('getCSRFToken', () => {
        afterEach(() => {
            const meta = document.querySelector('meta[name="csrf-token"]');
            if (meta) meta.remove();
        });

        it('returns token from meta tag', () => {
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            meta.setAttribute('content', 'test-token-123');
            document.head.appendChild(meta);

            const opts = new Options('onTest', {});
            expect(opts.getCSRFToken()).toBe('test-token-123');
        });

        it('returns null when no meta tag', () => {
            const opts = new Options('onTest', {});
            expect(opts.getCSRFToken()).toBeNull();
        });
    });

    describe('getXSRFToken', () => {
        it('returns null when no cookies', () => {
            const opts = new Options('onTest', {});
            expect(opts.getXSRFToken()).toBeNull();
        });
    });
});
