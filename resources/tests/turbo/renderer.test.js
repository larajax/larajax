import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { Renderer } from '../../src/turbo/renderer';

function createDelegate(overrides = {}) {
    return {
        viewAllowsImmediateRender: () => true,
        viewRendered: () => {},
        viewTransitionEnabled: () => false,
        setViewTransitionFinished: () => {},
        applicationHasSeenInlineScript: () => false,
        ...overrides
    };
}

function createRenderer(delegate) {
    const renderer = new Renderer();
    renderer.delegate = delegate;
    renderer.newBody = document.createElement('body');
    return renderer;
}

describe('Renderer', () => {
    let originalStartViewTransition;

    beforeEach(() => {
        originalStartViewTransition = document.startViewTransition;
    });

    afterEach(() => {
        if (originalStartViewTransition) {
            document.startViewTransition = originalStartViewTransition;
        } else {
            delete document.startViewTransition;
        }
    });

    describe('willPerformViewTransition', () => {
        it('returns false when startViewTransition is not available', () => {
            delete document.startViewTransition;
            const delegate = createDelegate({ viewTransitionEnabled: () => true });
            const renderer = createRenderer(delegate);
            expect(renderer.willPerformViewTransition()).toBe(false);
        });

        it('returns false when delegate has no viewTransitionEnabled method', () => {
            document.startViewTransition = () => {};
            const delegate = createDelegate();
            delete delegate.viewTransitionEnabled;
            const renderer = createRenderer(delegate);
            expect(renderer.willPerformViewTransition()).toBe(false);
        });

        it('returns false when delegate.viewTransitionEnabled returns false', () => {
            document.startViewTransition = () => {};
            const delegate = createDelegate({ viewTransitionEnabled: () => false });
            const renderer = createRenderer(delegate);
            expect(renderer.willPerformViewTransition()).toBe(false);
        });

        it('returns true when all conditions are met', () => {
            document.startViewTransition = () => {};
            const delegate = createDelegate({ viewTransitionEnabled: () => true });
            const renderer = createRenderer(delegate);
            expect(renderer.willPerformViewTransition()).toBe(true);
        });
    });

    describe('renderView', () => {
        it('calls delegate.viewAllowsImmediateRender', () => {
            let called = false;
            const delegate = createDelegate({
                viewAllowsImmediateRender: (body, options) => {
                    called = true;
                    return true;
                }
            });
            const renderer = createRenderer(delegate);
            renderer.renderView(() => {});
            expect(called).toBe(true);
        });

        it('executes callback and viewRendered when immediate render allowed', () => {
            let callbackCalled = false;
            let viewRenderedCalled = false;
            const delegate = createDelegate({
                viewRendered: () => { viewRenderedCalled = true; }
            });
            const renderer = createRenderer(delegate);
            renderer.renderView(() => { callbackCalled = true; });
            expect(callbackCalled).toBe(true);
            expect(viewRenderedCalled).toBe(true);
        });

        it('does not render when delegate prevents it', () => {
            let callbackCalled = false;
            const delegate = createDelegate({
                viewAllowsImmediateRender: () => false
            });
            const renderer = createRenderer(delegate);
            renderer.renderView(() => { callbackCalled = true; });
            expect(callbackCalled).toBe(false);
        });

        it('uses startViewTransition when available and enabled', () => {
            let transitionCallbackCalled = false;
            document.startViewTransition = (cb) => {
                transitionCallbackCalled = true;
                cb();
                return { finished: Promise.resolve() };
            };
            const delegate = createDelegate({ viewTransitionEnabled: () => true });
            const renderer = createRenderer(delegate);
            renderer.renderView(() => {});
            expect(transitionCallbackCalled).toBe(true);
        });

        it('calls setViewTransitionFinished with transition.finished promise', () => {
            const finishedPromise = Promise.resolve();
            document.startViewTransition = (cb) => {
                cb();
                return { finished: finishedPromise };
            };
            let receivedPromise = null;
            const delegate = createDelegate({
                viewTransitionEnabled: () => true,
                setViewTransitionFinished: (promise) => { receivedPromise = promise; }
            });
            const renderer = createRenderer(delegate);
            renderer.renderView(() => {});
            expect(receivedPromise).toBe(finishedPromise);
        });

        it('does not call setViewTransitionFinished without view transitions', () => {
            delete document.startViewTransition;
            let called = false;
            const delegate = createDelegate({
                setViewTransitionFinished: () => { called = true; }
            });
            const renderer = createRenderer(delegate);
            renderer.renderView(() => {});
            expect(called).toBe(false);
        });

        it('passes resume function in options for deferred rendering', () => {
            let resumeFn = null;
            const delegate = createDelegate({
                viewAllowsImmediateRender: (body, options) => {
                    resumeFn = options.resume;
                    return false; // Prevent immediate render
                }
            });
            const renderer = createRenderer(delegate);
            renderer.renderView(() => {});
            expect(typeof resumeFn).toBe('function');

            // Calling resume should trigger the render
            let callbackCalled = false;
            let viewRenderedCalled = false;
            renderer.delegate.viewRendered = () => { viewRenderedCalled = true; };
            renderer.delegate.viewAllowsImmediateRender = () => true;
            // Re-render with new callback through resume
            resumeFn();
            // The resume captures the original callback, not a new one
            // viewRendered should have been called
            expect(viewRenderedCalled).toBe(true);
        });
    });
});
