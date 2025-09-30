import { Events } from "../util/events";
import { RequestBuilder } from "./request-builder";

export class Controller
{
    constructor() {
        this.started = false;
        this.documentVisible = true;
    }

    start() {
        if (!this.started) {
            // Track unload event for request lib
            window.onbeforeunload = this.documentOnBeforeUnload;

            // First page load
            addEventListener('DOMContentLoaded', () => this.render());

            // Again, after new scripts load
            addEventListener('page:updated', () => this.render());

            // Again after AJAX request
            addEventListener('ajax:update-complete', () => this.render());

            // Watching document visibility
            addEventListener('visibilitychange', () => this.documentOnVisibilityChange());

            // Submit form
            Events.on(document, 'submit', '[data-request]', this.documentOnSubmit);

            // Track input
            Events.on(document, 'input', 'input[data-request][data-track-input]', this.documentOnKeyup);

            // Change select, checkbox, radio, file input
            Events.on(document, 'change', 'select[data-request], input[type=radio][data-request], input[type=checkbox][data-request], input[type=file][data-request]', this.documentOnChange);

            // Press enter on orphan input
            Events.on(document, 'keydown', 'input[type=text][data-request], input[type=submit][data-request], input[type=password][data-request]', this.documentOnKeydown);

            // Click submit button or link
            Events.on(document, 'click', 'a[data-request], button[data-request], input[type=button][data-request], input[type=submit][data-request]', this.documentOnClick);

            this.started = true;
        }
    }

    stop() {
        if (this.started) {
            this.started = false;
        }
    }

    render(event) {
        // Pre render event, used to move nodes around
        Events.dispatch('before-render');

        // Render event, used to initialize controls
        Events.dispatch('render');

        // Resize event to adjust all measurements
        dispatchEvent(new Event('resize'));

        this.documentOnRender(event);
    }

    documentOnVisibilityChange(event) {
        this.documentVisible = !document.hidden;
        if (this.documentVisible) {
            this.documentOnRender();
        }
    }

    documentOnRender(event) {
        if (!this.documentVisible) {
            return;
        }

        document.querySelectorAll('[data-auto-submit]').forEach(function(el) {
            const interval = el.dataset.autoSubmit || 0;
            el.removeAttribute('data-auto-submit');
            setTimeout(function() {
                RequestBuilder.fromElement(el);
            }, interval);
        });
    }

    documentOnSubmit(event) {
        event.preventDefault();
        RequestBuilder.fromElement(event.target);
    }

    documentOnClick(event) {
        event.preventDefault();
        RequestBuilder.fromElement(event.target);
    }

    documentOnChange(event) {
        RequestBuilder.fromElement(event.target);
    }

    documentOnKeyup(event) {
        var el = event.target,
            lastValue = el.dataset.ocLastValue;

        if (['email', 'number', 'password', 'search', 'text'].indexOf(el.type) === -1) {
            return;
        }

        if (lastValue !== undefined && lastValue == el.value) {
            return;
        }

        el.dataset.ocLastValue = el.value;

        if (this.dataTrackInputTimer !== undefined) {
            clearTimeout(this.dataTrackInputTimer);
        }

        var interval = el.getAttribute('data-track-input');
        if (!interval) {
            interval = 300;
        }

        var self = this;
        this.dataTrackInputTimer = setTimeout(function() {
            if (self.lastDataTrackInputRequest) {
                self.lastDataTrackInputRequest.abort();
            }

            self.lastDataTrackInputRequest = RequestBuilder.fromElement(el);
        }, interval);
    }

    documentOnKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();

            if (this.dataTrackInputTimer !== undefined) {
                clearTimeout(this.dataTrackInputTimer);
            }

            RequestBuilder.fromElement(event.target);
        }
    }

    documentOnBeforeUnload(event) {
        window.ocUnloading = true;
    }
}
