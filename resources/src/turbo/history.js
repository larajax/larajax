import { Location } from "./location";
import { defer } from "../util";

export class History
{
    constructor(delegate) {
        this.started = false;
        this.pageLoaded = false;

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
            const { restorationIdentifier } = ajaxTurbo;

            this.delegate.historyPoppedToLocationWithRestorationIdentifier(location, restorationIdentifier);
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
        const state = { ajaxTurbo: { restorationIdentifier } };

        method.call(history, state, '', location.absoluteURL);
    }
}
