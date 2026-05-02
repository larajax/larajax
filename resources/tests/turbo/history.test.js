import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { History } from '../../src/turbo/history';
import { Location } from '../../src/turbo/location';

describe('History', () => {
    let delegate;
    let historyInstance;

    beforeEach(() => {
        delegate = {
            historyPoppedToLocationWithRestorationIdentifier: mock(() => {})
        };
        historyInstance = new History(delegate);
    });

    afterEach(() => {
        if (historyInstance.started) {
            historyInstance.stop();
        }
    });

    describe('start/stop', () => {
        it('starts with started = false', () => {
            expect(historyInstance.started).toBe(false);
        });

        it('start() sets started to true', () => {
            historyInstance.start();
            expect(historyInstance.started).toBe(true);
        });

        it('stop() sets started to false', () => {
            historyInstance.start();
            historyInstance.stop();
            expect(historyInstance.started).toBe(false);
        });

        it('start() is idempotent', () => {
            historyInstance.start();
            historyInstance.start();
            expect(historyInstance.started).toBe(true);
        });
    });

    describe('push/replace', () => {
        it('push calls history.pushState with turbo state', () => {
            const pushSpy = spyOn(history, 'pushState').mockImplementation(() => {});
            const location = new Location('http://localhost/new-page');
            historyInstance.push(location, 'abc-123');
            expect(pushSpy).toHaveBeenCalledWith(
                { ajaxTurbo: { restorationIdentifier: 'abc-123' } },
                '',
                location.absoluteURL
            );
            pushSpy.mockRestore();
        });

        it('replace calls history.replaceState with turbo state', () => {
            const replaceSpy = spyOn(history, 'replaceState').mockImplementation(() => {});
            const location = new Location('http://localhost/current');
            historyInstance.replace(location, 'def-456');
            expect(replaceSpy).toHaveBeenCalledWith(
                { ajaxTurbo: { restorationIdentifier: 'def-456' } },
                '',
                location.absoluteURL
            );
            replaceSpy.mockRestore();
        });
    });

    describe('popstate handling', () => {
        it('ignores popstate before page load', () => {
            historyInstance.start();
            historyInstance.pageLoaded = false;

            // Override pageIsLoaded to return false
            const origReadyState = document.readyState;
            Object.defineProperty(document, 'readyState', {
                value: 'loading',
                configurable: true
            });

            const event = new PopStateEvent('popstate', {
                state: { ajaxTurbo: { restorationIdentifier: 'xyz' } }
            });
            window.dispatchEvent(event);
            expect(delegate.historyPoppedToLocationWithRestorationIdentifier).not.toHaveBeenCalled();

            Object.defineProperty(document, 'readyState', {
                value: origReadyState,
                configurable: true
            });
        });

        it('ignores popstate without ajaxTurbo state', () => {
            historyInstance.start();
            historyInstance.pageLoaded = true;

            const event = new PopStateEvent('popstate', {
                state: { someOtherState: true }
            });
            window.dispatchEvent(event);
            expect(delegate.historyPoppedToLocationWithRestorationIdentifier).not.toHaveBeenCalled();
        });

        it('ignores popstate with null state', () => {
            historyInstance.start();
            historyInstance.pageLoaded = true;

            const event = new PopStateEvent('popstate', { state: null });
            window.dispatchEvent(event);
            expect(delegate.historyPoppedToLocationWithRestorationIdentifier).not.toHaveBeenCalled();
        });

        it('calls delegate on popstate with valid ajaxTurbo state', () => {
            historyInstance.start();
            historyInstance.pageLoaded = true;

            // happy-dom may not carry state on PopStateEvent the same way,
            // so we directly invoke the handler to test the logic
            const fakeEvent = {
                state: { ajaxTurbo: { restorationIdentifier: 'restore-id' } }
            };
            historyInstance.onPopState(fakeEvent);
            expect(delegate.historyPoppedToLocationWithRestorationIdentifier).toHaveBeenCalled();
        });
    });
});
