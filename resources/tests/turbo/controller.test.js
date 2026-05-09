import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';

// Mock ProgressBar to avoid DOM side effects from BrowserAdapter
mock.module('../../src/extras/progress-bar', () => ({
    ProgressBar: class {
        show() {}
        hide() {}
        setValue() {}
    }
}));

import { Controller } from '../../src/turbo/controller';
import { Location } from '../../src/turbo/location';

describe('Controller', () => {
    let controller;

    beforeEach(() => {
        // Ensure Controller.supported is true
        Controller.supported = true;

        // Ensure scrollRestoration is available
        if (!('scrollRestoration' in history)) {
            Object.defineProperty(history, 'scrollRestoration', {
                value: 'auto',
                writable: true,
                configurable: true
            });
        } else {
            history.scrollRestoration = 'auto';
        }

        // Add turbo-visit-control meta to enable the controller
        let meta = document.querySelector('meta[name="turbo-visit-control"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'turbo-visit-control');
            meta.setAttribute('content', 'enable');
            document.head.appendChild(meta);
        }

        controller = new Controller();
        controller.location = new Location(window.location.href);

        // Clean up direction attribute
        document.documentElement.removeAttribute('data-turbo-visit-direction');
    });

    afterEach(() => {
        if (controller.started) {
            controller.stop();
        }
        // Clean up meta
        const meta = document.querySelector('meta[name="turbo-visit-control"]');
        if (meta) meta.remove();

        document.documentElement.removeAttribute('data-turbo-visit-direction');
    });

    describe('visit direction attribute', () => {
        it('sets data-turbo-visit-direction to forward for advance', () => {
            controller.markVisitDirection('advance');
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('forward');
        });

        it('sets data-turbo-visit-direction to back for restore', () => {
            controller.markVisitDirection('restore');
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('back');
        });

        it('sets data-turbo-visit-direction to none for unknown action', () => {
            controller.markVisitDirection('replace');
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('none');
        });

        it('uses explicit direction parameter when provided', () => {
            controller.markVisitDirection('restore', 'forward');
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('forward');
        });

        it('falls back to action-based direction when no explicit direction', () => {
            controller.markVisitDirection('advance');
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('forward');
            controller.markVisitDirection('restore');
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('back');
        });

        it('unmarkVisitDirection removes the attribute', () => {
            controller.markVisitDirection('advance');
            expect(document.documentElement.hasAttribute('data-turbo-visit-direction')).toBe(true);
            controller.unmarkVisitDirection();
            expect(document.documentElement.hasAttribute('data-turbo-visit-direction')).toBe(false);
        });
    });

    describe('view transition deferred cleanup', () => {
        const mockVisit = { getTimingMetrics: () => ({}) };

        it('defers unmarkVisitDirection until viewTransitionFinished resolves', async () => {
            controller.markVisitDirection('advance');

            let resolveTransition;
            const transitionPromise = new Promise(resolve => { resolveTransition = resolve; });
            controller.setViewTransitionFinished(transitionPromise);

            controller.visitCompleted(mockVisit);

            // Attribute should still be present
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('forward');

            // Resolve the transition
            resolveTransition();
            await transitionPromise;
            // Allow microtask to flush
            await new Promise(r => setTimeout(r, 0));

            expect(document.documentElement.hasAttribute('data-turbo-visit-direction')).toBe(false);
        });

        it('removes attribute even if viewTransitionFinished rejects', async () => {
            controller.markVisitDirection('advance');

            let rejectTransition;
            const transitionPromise = new Promise((_, reject) => { rejectTransition = reject; });
            controller.setViewTransitionFinished(transitionPromise);

            controller.visitCompleted(mockVisit);

            // Attribute should still be present
            expect(document.documentElement.getAttribute('data-turbo-visit-direction')).toBe('forward');

            // Reject the transition
            rejectTransition(new Error('transition skipped'));
            try { await transitionPromise; } catch {}
            await new Promise(r => setTimeout(r, 0));

            expect(document.documentElement.hasAttribute('data-turbo-visit-direction')).toBe(false);
        });

        it('clears viewTransitionFinished reference after deferring', () => {
            const transitionPromise = Promise.resolve();
            controller.setViewTransitionFinished(transitionPromise);
            expect(controller.viewTransitionFinished).toBe(transitionPromise);

            controller.visitCompleted(mockVisit);

            expect(controller.viewTransitionFinished).toBeNull();
        });

        it('removes attribute immediately when no view transition is active', () => {
            controller.markVisitDirection('advance');

            controller.visitCompleted(mockVisit);

            expect(document.documentElement.hasAttribute('data-turbo-visit-direction')).toBe(false);
        });
    });

    describe('scroll restoration', () => {
        it('start() sets history.scrollRestoration to manual', () => {
            history.scrollRestoration = 'auto';
            controller.start();
            expect(history.scrollRestoration).toBe('manual');
        });

        it('start() saves previous scrollRestoration value', () => {
            history.scrollRestoration = 'auto';
            controller.start();
            expect(controller.previousScrollRestoration).toBe('auto');
        });

        it('stop() restores previous scrollRestoration value', () => {
            history.scrollRestoration = 'auto';
            controller.start();
            expect(history.scrollRestoration).toBe('manual');
            controller.stop();
            expect(history.scrollRestoration).toBe('auto');
        });
    });

    describe('lifecycle', () => {
        it('starts with started = false', () => {
            expect(controller.started).toBe(false);
        });

        it('start() sets started to true', () => {
            controller.start();
            expect(controller.started).toBe(true);
        });

        it('stop() sets started to false', () => {
            controller.start();
            expect(controller.started).toBe(true);
            controller.stop();
            expect(controller.started).toBe(false);
        });

        it('start() is idempotent when already started', () => {
            controller.start();
            const firstScrollManager = controller.scrollManager;
            controller.start(); // should be a no-op
            expect(controller.scrollManager).toBe(firstScrollManager);
            expect(controller.started).toBe(true);
        });

        it('disable() sets enabled to false', () => {
            controller.start();
            expect(controller.enabled).toBe(true);
            controller.disable();
            expect(controller.enabled).toBe(false);
        });

        it('isEnabled() returns true when started and enabled', () => {
            controller.start();
            expect(controller.isEnabled()).toBe(true);
        });

        it('isEnabled() returns false before start', () => {
            expect(controller.isEnabled()).toBe(false);
        });

        it('isEnabled() returns false when disabled', () => {
            controller.start();
            controller.disable();
            expect(controller.isEnabled()).toBe(false);
        });
    });

    describe('setViewTransitionFinished', () => {
        it('stores the promise', () => {
            const promise = Promise.resolve();
            controller.setViewTransitionFinished(promise);
            expect(controller.viewTransitionFinished).toBe(promise);
        });

        it('initializes as null', () => {
            expect(controller.viewTransitionFinished).toBeNull();
        });
    });

    describe('inline script tracking', () => {
        it('returns false for new scripts', () => {
            const el = document.createElement('script');
            el.setAttribute('data-turbo-eval-once', 'script-1');
            expect(controller.applicationHasSeenInlineScript(el)).toBe(false);
        });

        it('returns true for previously seen scripts', () => {
            const el = document.createElement('script');
            el.setAttribute('data-turbo-eval-once', 'script-2');
            controller.applicationHasSeenInlineScript(el);
            expect(controller.applicationHasSeenInlineScript(el)).toBe(true);
        });

        it('returns false for scripts without data-turbo-eval-once', () => {
            const el = document.createElement('script');
            expect(controller.applicationHasSeenInlineScript(el)).toBe(false);
        });

        it('trims oldest entries when at limit', () => {
            controller.uniqueInlineScriptsLimit = 3;

            for (let i = 0; i < 3; i++) {
                const el = document.createElement('script');
                el.setAttribute('data-turbo-eval-once', `limit-${i}`);
                controller.applicationHasSeenInlineScript(el);
            }

            // Set has: limit-0, limit-1, limit-2 (size = 3 = limit)
            // Adding limit-3 should evict limit-0 (oldest)
            const el = document.createElement('script');
            el.setAttribute('data-turbo-eval-once', 'limit-3');
            controller.applicationHasSeenInlineScript(el);

            // Verify limit-0 was evicted (no longer in set)
            expect(controller.uniqueInlineScripts.has('limit-0')).toBe(false);

            // Verify later entries are still present
            expect(controller.uniqueInlineScripts.has('limit-2')).toBe(true);
            expect(controller.uniqueInlineScripts.has('limit-3')).toBe(true);
        });
    });
});
