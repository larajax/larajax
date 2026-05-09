import { Location } from "./location";
import { defer } from "../util";

export class History
{
    constructor(delegate) {
        this.started = false;
        this.pageLoaded = false;
        this.currentPosition = 0;

        // Event handlers
        this.onPopState = (event) => {
            if (!this.shouldHandlePopState()) {
                return;
            }

            if (!event.state || !event.state.ajaxTurbo) {
                return;
            }

            const { ajaxTurbo } = event.state;
            const location = Location.currentLocation;
            const { restorationIdentifier, position } = ajaxTurbo;
            const direction = (typeof position === 'number' && position > this.currentPosition) ? 'forward' : 'back';
            this.currentPosition = typeof position === 'number' ? position : this.currentPosition;

            this.delegate.historyPoppedToLocationWithRestorationIdentifier(location, restorationIdentifier, direction);
        };

        this.onPageLoad = (event) => {
            defer(() => {
                this.pageLoaded = true;
            });
        };

        this.delegate = delegate;
    }

    start() {
        if (!this.started) {
            addEventListener('popstate', this.onPopState, false);
            addEventListener('load', this.onPageLoad, false);
            this.started = true;
        }
    }

    stop() {
        if (this.started) {
            removeEventListener('popstate', this.onPopState, false);
            removeEventListener('load', this.onPageLoad, false);
            this.started = false;
        }
    }

    push(location, restorationIdentifier) {
        this.currentPosition++;
        this.update(history.pushState, location, restorationIdentifier);
    }

    replace(location, restorationIdentifier) {
        this.update(history.replaceState, location, restorationIdentifier);
    }

    // Private
    shouldHandlePopState() {
        // Safari dispatches a popstate event after window's load event, ignore it
        return this.pageIsLoaded();
    }

    pageIsLoaded() {
        return this.pageLoaded || document.readyState == 'complete';
    }

    update(method, location, restorationIdentifier) {
        const state = { ajaxTurbo: { restorationIdentifier, position: this.currentPosition } };

        method.call(history, state, '', location.absoluteURL);
    }
}
