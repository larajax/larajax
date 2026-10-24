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
        }
    };
}

function createRenderer(delegate) {
    return new PageRenderer(delegate, { headDetails: {} }, { headDetails: {}, bodyElement: null });
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
});
