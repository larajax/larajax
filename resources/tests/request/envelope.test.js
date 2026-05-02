import { describe, it, expect } from 'bun:test';
import { Envelope } from '../../src/request/envelope';

function makeResponse(body = {}, data = {}) {
    return { __ajax: body, ...data };
}

describe('Envelope', () => {
    describe('constructor', () => {
        it('parses response with __ajax body', () => {
            const env = new Envelope(makeResponse({ ok: true, message: 'Success' }));
            expect(env.ok).toBe(true);
            expect(env.message).toBe('Success');
        });

        it('defaults severity to info', () => {
            const env = new Envelope(makeResponse({}));
            expect(env.severity).toBe('info');
        });

        it('defaults message to null', () => {
            const env = new Envelope(makeResponse({}));
            expect(env.message).toBeNull();
        });

        it('extracts data from response excluding __ajax', () => {
            const env = new Envelope(makeResponse({ ok: true }, { result: 42 }));
            expect(env.data.result).toBe(42);
            expect(env.data.__ajax).toBeUndefined();
        });

        it('defaults ops to empty array when not provided', () => {
            const env = new Envelope(makeResponse({}));
            expect(env.ops).toEqual([]);
        });

        it('defaults ops to empty array when not an array', () => {
            const env = new Envelope(makeResponse({ ops: 'not-array' }));
            expect(env.ops).toEqual([]);
        });
    });

    describe('isFatal', () => {
        it('returns true for fatal severity', () => {
            const env = new Envelope(makeResponse({ severity: 'fatal' }));
            expect(env.isFatal()).toBe(true);
        });

        it('returns true for 500 status', () => {
            const env = new Envelope(makeResponse({}), 500);
            expect(env.isFatal()).toBe(true);
        });

        it('returns true for 503 status', () => {
            const env = new Envelope(makeResponse({}), 503);
            expect(env.isFatal()).toBe(true);
        });

        it('returns false for 200 status with info severity', () => {
            const env = new Envelope(makeResponse({ severity: 'info' }), 200);
            expect(env.isFatal()).toBe(false);
        });

        it('returns false for 400 status', () => {
            const env = new Envelope(makeResponse({}), 400);
            expect(env.isFatal()).toBe(false);
        });
    });

    describe('isError', () => {
        it('returns true for error severity', () => {
            const env = new Envelope(makeResponse({ severity: 'error' }));
            expect(env.isError()).toBe(true);
        });

        it('returns true when ok is false', () => {
            const env = new Envelope(makeResponse({ ok: false }));
            expect(env.isError()).toBe(true);
        });

        it('returns true when fatal', () => {
            const env = new Envelope(makeResponse({ severity: 'fatal' }));
            expect(env.isError()).toBe(true);
        });

        it('returns false for successful response', () => {
            const env = new Envelope(makeResponse({ ok: true, severity: 'info' }));
            expect(env.isError()).toBe(false);
        });
    });

    describe('getOps', () => {
        it('returns all ops when no type specified', () => {
            const ops = [{ op: 'flash' }, { op: 'redirect' }];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getOps()).toEqual(ops);
        });

        it('filters ops by type', () => {
            const ops = [{ op: 'flash', text: 'hi' }, { op: 'redirect', url: '/' }, { op: 'flash', text: 'bye' }];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getOps('flash')).toHaveLength(2);
            expect(env.getOps('redirect')).toHaveLength(1);
        });

        it('returns empty array for unknown type', () => {
            const env = new Envelope(makeResponse({ ops: [{ op: 'flash' }] }));
            expect(env.getOps('nonexistent')).toEqual([]);
        });
    });

    describe('getFlash', () => {
        it('extracts flash messages from ops', () => {
            const ops = [{ op: 'flash', level: 'success', text: 'Saved!' }];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getFlash()).toEqual([{ level: 'success', text: 'Saved!' }]);
        });

        it('defaults level to info and text to empty', () => {
            const ops = [{ op: 'flash' }];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getFlash()).toEqual([{ level: 'info', text: '' }]);
        });
    });

    describe('getBrowserEvents', () => {
        it('extracts dispatch events from ops', () => {
            const ops = [{ op: 'dispatch', event: 'custom:event', detail: { id: 1 } }];
            const env = new Envelope(makeResponse({ ops }));
            const events = env.getBrowserEvents();
            expect(events).toHaveLength(1);
            expect(events[0].event).toBe('custom:event');
            expect(events[0].detail).toEqual({ id: 1 });
        });
    });

    describe('getAssets', () => {
        it('deduplicates assets by URL', () => {
            const ops = [
                { op: 'loadAssets', type: 'js', assets: ['script.js', 'script.js', 'other.js'] }
            ];
            const env = new Envelope(makeResponse({ ops }));
            const assets = env.getAssets();
            expect(assets.js).toHaveLength(2);
            expect(assets.js[0]).toEqual({ url: 'script.js' });
            expect(assets.js[1]).toEqual({ url: 'other.js' });
        });

        it('always includes inline assets (no dedup)', () => {
            const ops = [
                { op: 'loadAssets', type: 'js', assets: [
                    { inline: true, content: 'alert(1)' },
                    { inline: true, content: 'alert(1)' }
                ]}
            ];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getAssets().js).toHaveLength(2);
        });

        it('handles mixed string and object formats', () => {
            const ops = [
                { op: 'loadAssets', type: 'css', assets: [
                    'style.css',
                    { url: 'theme.css', attributes: { media: 'print' } }
                ]}
            ];
            const env = new Envelope(makeResponse({ ops }));
            const assets = env.getAssets();
            expect(assets.css).toHaveLength(2);
            expect(assets.css[0]).toEqual({ url: 'style.css' });
            expect(assets.css[1]).toEqual({ url: 'theme.css', attributes: { media: 'print' } });
        });

        it('deduplicates across multiple loadAssets ops', () => {
            const ops = [
                { op: 'loadAssets', type: 'js', assets: ['a.js', 'b.js'] },
                { op: 'loadAssets', type: 'js', assets: ['b.js', 'c.js'] }
            ];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getAssets().js).toHaveLength(3);
        });

        it('ignores unknown asset types', () => {
            const ops = [
                { op: 'loadAssets', type: 'unknown', assets: ['file.txt'] }
            ];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getAssets().js).toHaveLength(0);
            expect(env.getAssets().css).toHaveLength(0);
        });

        it('returns empty arrays when no assets', () => {
            const env = new Envelope(makeResponse({}));
            const assets = env.getAssets();
            expect(assets).toEqual({ js: [], css: [], img: [] });
        });
    });

    describe('getRedirectUrl', () => {
        it('extracts redirect URL from ops', () => {
            const ops = [{ op: 'redirect', url: '/dashboard' }];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getRedirectUrl()).toBe('/dashboard');
        });

        it('falls back to redirect property', () => {
            const env = new Envelope(makeResponse({}));
            env.redirect = '/fallback';
            expect(env.getRedirectUrl()).toBe('/fallback');
        });

        it('returns null when no redirect', () => {
            const env = new Envelope(makeResponse({}));
            expect(env.getRedirectUrl()).toBeNull();
        });
    });

    describe('getPartials', () => {
        it('extracts partials from ops', () => {
            const ops = [{ op: 'partial', name: 'sidebar', html: '<div>content</div>' }];
            const env = new Envelope(makeResponse({ ops }));
            const partials = env.getPartials();
            expect(partials).toEqual([{ name: 'sidebar', html: '<div>content</div>' }]);
        });

        it('defaults html to empty string', () => {
            const ops = [{ op: 'partial', name: 'sidebar' }];
            const env = new Envelope(makeResponse({ ops }));
            expect(env.getPartials()[0].html).toBe('');
        });
    });
});
