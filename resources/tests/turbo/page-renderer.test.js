import { describe, it, expect } from 'bun:test';
import { PageRenderer } from '../../src/turbo/page-renderer';

function createDelegate() {
    return {
        pendingAssets: 0,
        trackPendingAsset() {
            this.pendingAssets++;
            return () => {
                this.pendingAssets--;
            };
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

function activateBody(html) {
    const delegate = createDelegate();
    const body = createBody(html);
    createRenderer(delegate, body).activateNewBodyScriptElements();
    return { delegate, body };
}

function createInlineModule(parentElement) {
    const element = document.createElement('script');
    element.setAttribute('type', 'module');
    element.textContent = 'init()';
    parentElement.appendChild(element);
    return element;
}

function getSignalId(signalElement) {
    return signalElement.textContent.match(/detail: '([^']+)'/)[1];
}

function dispatchModuleLoaded(id) {
    dispatchEvent(new CustomEvent('turbo:module-loaded', { detail: id }));
}

describe('PageRenderer', () => {
    describe('pending body scripts', () => {
        it('holds for modules and external classic scripts', () => {
            const { delegate } = activateBody(
                '<script type="module">init()</script>' +
                '<script type="module" src="/app.js"></script>' +
                '<script src="/classic.js"></script>' +
                '<script src="/deferred.js" defer></script>' +
                '<script type="text/javascript" src="/typed.js"></script>'
            );

            expect(delegate.pendingAssets).toBe(5);
        });

        it('does not hold for scripts a full page load would not wait for', () => {
            const { delegate } = activateBody(
                '<script>classic()</script>' +
                '<script src="/async.js" async></script>' +
                '<script type="module" src="/async-module.js" async></script>' +
                '<script src="/legacy.js" nomodule></script>' +
                '<script type="text/x-template" src="/template.html"></script>' +
                '<script type="application/ld+json">{}</script>'
            );

            expect(delegate.pendingAssets).toBe(0);
        });

        it('does not hold for scripts that will not be evaluated', () => {
            const { delegate } = activateBody(
                '<script type="module" data-turbo-eval="false">init()</script>' +
                '<script src="/app.js" data-turbo-eval="false"></script>'
            );

            expect(delegate.pendingAssets).toBe(0);
        });

        it('does not hold for an inline script that has already run once', () => {
            const delegate = createDelegate();
            delegate.applicationHasSeenInlineScript = () => true;
            const body = createBody('<script type="module" data-turbo-eval-once="abc">init()</script>');

            createRenderer(delegate, body).activateNewBodyScriptElements();

            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles an external script when it loads', () => {
            const { delegate, body } = activateBody('<script src="/classic.js"></script>');

            expect(delegate.pendingAssets).toBe(1);
            body.querySelector('script').dispatchEvent(new Event('load'));
            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles an external module when it fails to load', () => {
            const { delegate, body } = activateBody('<script type="module" src="/missing.js"></script>');

            body.querySelector('script').dispatchEvent(new Event('error'));
            expect(delegate.pendingAssets).toBe(0);
        });

        it('settles an external script only once', () => {
            const { delegate, body } = activateBody('<script src="/classic.js"></script>');

            const element = body.querySelector('script');
            element.dispatchEvent(new Event('error'));
            element.dispatchEvent(new Event('load'));

            expect(delegate.pendingAssets).toBe(0);
        });

        it('leaves the text of an external module alone', () => {
            const { body } = activateBody('<script type="module" src="/app.js"></script>');

            expect(body.querySelectorAll('script').length).toBe(1);
            expect(body.querySelector('script').textContent).toBe('');
        });
    });

    describe('inline module signal', () => {
        it('inserts a separate signal module after the inline module', () => {
            const { body } = activateBody('<script type="module">init()</script><p></p>');

            const [module, signal] = body.querySelectorAll('script');
            expect(module.textContent).toBe('init()');
            expect(signal.getAttribute('type')).toBe('module');
            expect(signal.previousElementSibling).toBe(module);
            expect(signal.textContent).toContain("dispatchEvent(new CustomEvent('turbo:module-loaded'");
        });

        it('settles and removes itself when its own signal fires', () => {
            const { delegate, body } = activateBody('<script type="module">init()</script>');

            const signal = body.querySelectorAll('script')[1];
            dispatchModuleLoaded(getSignalId(signal));

            expect(delegate.pendingAssets).toBe(0);
            expect(body.querySelectorAll('script').length).toBe(1);
        });

        it('ignores signals from other modules', () => {
            const { delegate, body } = activateBody(
                '<script type="module">first()</script>' +
                '<script type="module">second()</script>'
            );

            const scripts = body.querySelectorAll('script');
            dispatchModuleLoaded(getSignalId(scripts[1]));
            expect(delegate.pendingAssets).toBe(1);

            dispatchModuleLoaded(getSignalId(scripts[1]));
            expect(delegate.pendingAssets).toBe(1);

            dispatchModuleLoaded(getSignalId(scripts[3]));
            expect(delegate.pendingAssets).toBe(0);
        });

        it('carries the nonce of the inline module', () => {
            const head = document.createElement('head');
            const element = createInlineModule(head);
            element.nonce = 'abc123';

            createRenderer(createDelegate()).bindPendingScriptElement(element);

            expect(head.querySelectorAll('script')[1].nonce).toBe('abc123');
        });
    });

    describe('bindPendingScriptElement', () => {
        it('holds for an inline module in the head', () => {
            const delegate = createDelegate();
            const head = document.createElement('head');
            const element = createInlineModule(head);

            createRenderer(delegate).bindPendingScriptElement(element);

            expect(delegate.pendingAssets).toBe(1);
            dispatchModuleLoaded(getSignalId(head.querySelectorAll('script')[1]));
            expect(delegate.pendingAssets).toBe(0);
        });
    });
});
