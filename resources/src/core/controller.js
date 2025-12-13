import { Events } from "../util/events";
import { Trigger } from "./trigger";

export class Controller
{
    constructor() {
        this.started = false;
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

            this.started = true;
        }
    }

    stop() {
        if (this.started) {
            this.started = false;
        }
    }

    render() {
        // Pre render event, used to move nodes around
        Events.dispatch('before-render');

        // Render event, used to initialize controls
        Events.dispatch('render');

        // Resize event to adjust all measurements
        dispatchEvent(new Event('resize'));

        // Bind triggers on elements that haven't been bound yet
        document.querySelectorAll('[data-request]:not([data-trigger-bound])').forEach(el => {
            el.setAttribute('data-trigger-bound', '');
            new Trigger(el).bind();
        });
    }

    documentOnBeforeUnload(event) {
        window.jaxUnloading = true;
    }
}
