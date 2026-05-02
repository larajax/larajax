import { describe, it, expect } from 'bun:test';
import { DomPatcher, DomUpdateMode, resolveSelectorResponse } from '../../src/request/dom-patcher';

describe('resolveSelectorResponse', () => {
    it('returns elements matching partialSelector when selector is true', () => {
        const div = document.createElement('div');
        div.setAttribute('data-ajax-partial', 'sidebar');
        document.body.appendChild(div);

        const result = resolveSelectorResponse(true, '[data-ajax-partial="sidebar"]');
        expect(result.length).toBe(1);
        div.remove();
    });

    it('wraps DOM element in array', () => {
        const el = document.createElement('div');
        const result = resolveSelectorResponse(el, '');
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toBe(el);
    });

    it('returns empty array for invalid selector prefix', () => {
        const result = resolveSelectorResponse('invalid-selector', '');
        expect(Array.from(result)).toEqual([]);
    });

    it('accepts # selector prefix', () => {
        const div = document.createElement('div');
        div.id = 'test-resolve';
        document.body.appendChild(div);

        const result = resolveSelectorResponse('#test-resolve', '');
        expect(result.length).toBe(1);
        div.remove();
    });

    it('accepts . selector prefix', () => {
        const div = document.createElement('div');
        div.className = 'test-resolve-class';
        document.body.appendChild(div);

        const result = resolveSelectorResponse('.test-resolve-class', '');
        expect(result.length).toBe(1);
        div.remove();
    });

    it('strips @ prefix and uses remaining as selector', () => {
        const div = document.createElement('div');
        div.id = 'append-target';
        document.body.appendChild(div);

        const result = resolveSelectorResponse('@#append-target', '');
        expect(result.length).toBe(1);
        div.remove();
    });

    it('strips ^ prefix and uses remaining as selector', () => {
        const div = document.createElement('div');
        div.id = 'prepend-target';
        document.body.appendChild(div);

        const result = resolveSelectorResponse('^#prepend-target', '');
        expect(result.length).toBe(1);
        div.remove();
    });

    it('strips ! prefix and uses remaining as selector', () => {
        const div = document.createElement('div');
        div.id = 'replace-target';
        document.body.appendChild(div);

        const result = resolveSelectorResponse('!#replace-target', '');
        expect(result.length).toBe(1);
        div.remove();
    });

    it('falls back to partialSelector when prefix char has empty remainder', () => {
        const div = document.createElement('div');
        div.setAttribute('data-ajax-partial', 'test');
        document.body.appendChild(div);

        const result = resolveSelectorResponse('@', '[data-ajax-partial="test"]');
        expect(result.length).toBe(1);
        div.remove();
    });
});

describe('DomPatcher', () => {
    describe('patchDom', () => {
        it('updates innerHTML for "update" mode', () => {
            const el = document.createElement('div');
            el.innerHTML = '<p>old</p>';
            document.body.appendChild(el);

            const env = { getPartials: () => [], getDomPatches: () => [] };
            const patcher = new DomPatcher(env, {});
            patcher.patchDom(el, '<span>new</span>', 'update');

            expect(el.innerHTML).toBe('<span>new</span>');
            el.remove();
        });

        it('updates innerHTML for "innerHTML" mode', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            const env = { getPartials: () => [], getDomPatches: () => [] };
            const patcher = new DomPatcher(env, {});
            patcher.patchDom(el, '<b>bold</b>', 'innerHTML');

            expect(el.innerHTML).toBe('<b>bold</b>');
            el.remove();
        });

        it('appends content for "append" mode', () => {
            const el = document.createElement('div');
            el.innerHTML = '<p>first</p>';
            document.body.appendChild(el);

            const env = { getPartials: () => [], getDomPatches: () => [] };
            const patcher = new DomPatcher(env, {});
            patcher.patchDom(el, '<p>second</p>', 'append');

            expect(el.children.length).toBe(2);
            expect(el.children[0].textContent).toBe('first');
            expect(el.children[1].textContent).toBe('second');
            el.remove();
        });

        it('prepends content for "prepend" mode', () => {
            const el = document.createElement('div');
            el.innerHTML = '<p>second</p>';
            document.body.appendChild(el);

            const env = { getPartials: () => [], getDomPatches: () => [] };
            const patcher = new DomPatcher(env, {});
            patcher.patchDom(el, '<p>first</p>', 'prepend');

            expect(el.children.length).toBe(2);
            expect(el.children[0].textContent).toBe('first');
            el.remove();
        });

        it('replaces element for "replace" mode', () => {
            const container = document.createElement('div');
            const el = document.createElement('p');
            el.id = 'to-replace';
            el.textContent = 'old';
            container.appendChild(el);
            document.body.appendChild(container);

            const env = { getPartials: () => [], getDomPatches: () => [] };
            const patcher = new DomPatcher(env, {});
            patcher.patchDom(el, '<span>new</span>', 'replace');

            expect(container.querySelector('#to-replace')).toBeNull();
            expect(container.querySelector('span').textContent).toBe('new');
            container.remove();
        });

        it('calls afterUpdate callback', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            let callbackEl = null;
            const env = { getPartials: () => [], getDomPatches: () => [] };
            const patcher = new DomPatcher(env, {});
            patcher.afterUpdate((e) => { callbackEl = e; });
            patcher.patchDom(el, '<p>new</p>', 'update');

            expect(callbackEl).toBe(el);
            el.remove();
        });

        it('defaults to update mode', () => {
            const el = document.createElement('div');
            el.innerHTML = '<p>old</p>';
            document.body.appendChild(el);

            const env = { getPartials: () => [], getDomPatches: () => [] };
            const patcher = new DomPatcher(env, {});
            patcher.patchDom(el, '<span>default</span>', 'unknown-mode');

            // Unknown mode falls through to default (update)
            expect(el.innerHTML).toBe('<span>default</span>');
            el.remove();
        });
    });
});
