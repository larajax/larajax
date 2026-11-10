import { describe, it, expect } from 'bun:test';
import { PageRenderer } from '../../src/turbo/page-renderer';

function createDelegate() {
    return {
        pendingAssets: 0,
        incrementPendingAsset() {
            this.pendingAssets++;
        },
        decrementPendingAsset() {
            this.pendingAssets--;
        },
        applicationHasSeenInlineScript() {
            return false;
        }
    };
}

function createRenderer(delegate, bodyElement = null) {
    return new PageRenderer(delegate, { headDetails: {} }, { headDetails: {}, bodyElement });
}

function createBody(html) {
    const element = document.createElement('body');
    element.innerHTML = html;
    return element;
}

function createScript(src) {
    const element = document.createElement('script');
    if (src) {
        element.setAttribute('src', src);
    }
    return element;
}

describe('PageRenderer', () => {
    describe('bindPendingAssetLoadedEventOnce', () => {
        it('counts a script with a src as a pending asset', () => {
            const delegate = createDelegate();
            createRenderer(delegate).bindPendingAssetLoadedEventOnce(createScript('/app.js'));

            expect(delegate.pendingAssets).toBe(1);
        });

        it('ignores an inline script', () => {
            const delegate = createDelegate();
            createRenderer(delegate).bindPendingAssetLoadedEventOnce(createScript());

            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles the pending asset when the script loads', () => {
            const delegate = createDelegate();
            const element = createRenderer(delegate).bindPendingAssetLoadedEventOnce(createScript('/app.js'));

            element.dispatchEvent(new Event('load'));

            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles the pending asset when the script fails to load', () => {
            const delegate = createDelegate();
            const element = createRenderer(delegate).bindPendingAssetLoadedEventOnce(createScript('/missing.js'));

            element.dispatchEvent(new Event('error'));

            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles the pending asset only once', () => {
            const delegate = createDelegate();
            const element = createRenderer(delegate).bindPendingAssetLoadedEventOnce(createScript('/app.js'));

            element.dispatchEvent(new Event('error'));
            element.dispatchEvent(new Event('load'));
            element.dispatchEvent(new Event('error'));

            expect(delegate.pendingAssets).toBe(0);
        });
    });

    describe('body module scripts', () => {
        it('counts inline and external modules as pending assets', () => {
            const delegate = createDelegate();
            const body = createBody(
                '<script type="module">init()</script>' +
                '<script type="module" src="/app.js"></script>' +
                '<script src="/classic.js"></script>' +
                '<script>classic()</script>'
            );

            createRenderer(delegate, body).countNewBodyModuleScripts();

            expect(delegate.pendingAssets).toBe(2);
        });

        it('ignores modules that will not be evaluated', () => {
            const delegate = createDelegate();
            const body = createBody(
                '<script type="module" data-turbo-eval="false">init()</script>' +
                '<script type="module" src="/app.js" data-turbo-eval="false"></script>'
            );

            const element = body.querySelector('script');
            const renderer = createRenderer(delegate, body);
            renderer.countNewBodyModuleScripts();
            renderer.activateNewBodyScriptElements();

            expect(delegate.pendingAssets).toBe(0);
            expect(element.textContent).toBe('init()');
        });

        it('signals from an inline module once it has run', () => {
            const delegate = createDelegate();
            const body = createBody('<script type="module">init()</script>');

            createRenderer(delegate, body).activateNewBodyScriptElements();

            expect(body.querySelector('script').textContent).toContain("dispatchEvent(new CustomEvent('turbo:module-loaded'))");
        });

        it('settles an external module when it loads', () => {
            const delegate = createDelegate();
            const body = createBody('<script type="module" src="/app.js"></script>');

            const renderer = createRenderer(delegate, body);
            renderer.countNewBodyModuleScripts();
            renderer.activateNewBodyScriptElements();

            const element = body.querySelector('script');
            expect(element.textContent).toBe('');
            expect(delegate.pendingAssets).toBe(1);

            element.dispatchEvent(new Event('load'));
            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles an external module when it fails to load', () => {
            const delegate = createDelegate();
            const body = createBody('<script type="module" src="/missing.js"></script>');

            const renderer = createRenderer(delegate, body);
            renderer.countNewBodyModuleScripts();
            renderer.activateNewBodyScriptElements();

            body.querySelector('script').dispatchEvent(new Event('error'));
            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles an external module only once', () => {
            const delegate = createDelegate();
            const body = createBody('<script type="module" src="/app.js"></script>');

            const renderer = createRenderer(delegate, body);
            renderer.countNewBodyModuleScripts();
            renderer.activateNewBodyScriptElements();

            const element = body.querySelector('script');
            element.dispatchEvent(new Event('load'));
            element.dispatchEvent(new Event('load'));

            expect(delegate.pendingAssets).toBe(0);
        });
    });
});
