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
        it('push calls history.pushState with turbo state including position', () => {
            const pushSpy = spyOn(history, 'pushState').mockImplementation(() => {});
            const location = new Location('http://localhost/new-page');
            historyInstance.push(location, 'abc-123');
            expect(pushSpy).toHaveBeenCalledWith(
                { ajaxTurbo: { restorationIdentifier: 'abc-123', position: 1 } },
                '',
                location.absoluteURL
            );
            pushSpy.mockRestore();
        });

        it('replace calls history.replaceState with turbo state including position', () => {
            const replaceSpy = spyOn(history, 'replaceState').mockImplementation(() => {});
            const location = new Location('http://localhost/current');
            historyInstance.replace(location, 'def-456');
            expect(replaceSpy).toHaveBeenCalledWith(
                { ajaxTurbo: { restorationIdentifier: 'def-456', position: 0 } },
                '',
                location.absoluteURL
            );
            replaceSpy.mockRestore();
        });

        it('push increments position each time', () => {
            const pushSpy = spyOn(history, 'pushState').mockImplementation(() => {});
            const loc1 = new Location('http://localhost/page-1');
            const loc2 = new Location('http://localhost/page-2');
            historyInstance.push(loc1, 'id-1');
            historyInstance.push(loc2, 'id-2');
            expect(pushSpy).toHaveBeenNthCalledWith(1,
                { ajaxTurbo: { restorationIdentifier: 'id-1', position: 1 } }, '', loc1.absoluteURL
            );
            expect(pushSpy).toHaveBeenNthCalledWith(2,
                { ajaxTurbo: { restorationIdentifier: 'id-2', position: 2 } }, '', loc2.absoluteURL
            );
            pushSpy.mockRestore();
        });

        it('replace does not increment position', () => {
            const pushSpy = spyOn(history, 'pushState').mockImplementation(() => {});
            const replaceSpy = spyOn(history, 'replaceState').mockImplementation(() => {});
            const loc1 = new Location('http://localhost/page-1');
            const loc2 = new Location('http://localhost/page-1-replaced');
            const loc3 = new Location('http://localhost/page-2');
            historyInstance.push(loc1, 'id-1');    // position 1
            historyInstance.replace(loc2, 'id-1b'); // position stays 1
            historyInstance.push(loc3, 'id-2');    // position 2
            expect(replaceSpy).toHaveBeenCalledWith(
                { ajaxTurbo: { restorationIdentifier: 'id-1b', position: 1 } }, '', loc2.absoluteURL
            );
            expect(pushSpy).toHaveBeenLastCalledWith(
                { ajaxTurbo: { restorationIdentifier: 'id-2', position: 2 } }, '', loc3.absoluteURL
            );
            pushSpy.mockRestore();
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

        it('passes direction "back" when popstate position is lower than current', () => {
            historyInstance.pageLoaded = true;
            historyInstance.currentPosition = 3;

            const fakeEvent = {
                state: { ajaxTurbo: { restorationIdentifier: 'back-id', position: 1 } }
            };
            historyInstance.onPopState(fakeEvent);
            expect(delegate.historyPoppedToLocationWithRestorationIdentifier).toHaveBeenCalledWith(
                expect.anything(), 'back-id', 'back'
            );
        });

        it('passes direction "forward" when popstate position is higher than current', () => {
            historyInstance.pageLoaded = true;
            historyInstance.currentPosition = 1;

            const fakeEvent = {
                state: { ajaxTurbo: { restorationIdentifier: 'fwd-id', position: 3 } }
            };
            historyInstance.onPopState(fakeEvent);
            expect(delegate.historyPoppedToLocationWithRestorationIdentifier).toHaveBeenCalledWith(
                expect.anything(), 'fwd-id', 'forward'
            );
        });

        it('defaults to "back" when position is missing from state', () => {
            historyInstance.pageLoaded = true;
            historyInstance.currentPosition = 2;

            const fakeEvent = {
                state: { ajaxTurbo: { restorationIdentifier: 'old-id' } }
            };
            historyInstance.onPopState(fakeEvent);
            expect(delegate.historyPoppedToLocationWithRestorationIdentifier).toHaveBeenCalledWith(
                expect.anything(), 'old-id', 'back'
            );
        });

        it('updates currentPosition from popstate event', () => {
            historyInstance.pageLoaded = true;
            historyInstance.currentPosition = 3;

            const fakeEvent = {
                state: { ajaxTurbo: { restorationIdentifier: 'nav-id', position: 1 } }
            };
            historyInstance.onPopState(fakeEvent);
            expect(historyInstance.currentPosition).toBe(1);
        });
    });
});
