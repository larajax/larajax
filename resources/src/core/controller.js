import { Events } from "../util/events";
import { Trigger } from "./trigger";
import { turboPageReady } from "../util/turbo";
import { domReady } from "../util/wait";

export class Controller
{
    constructor() {
        this.started = false;
        this.triggers = new WeakMap();
    }

    start() {
        if (!this.started) {
            // Track unload event for request lib
            addEventListener('beforeunload', this.documentOnBeforeUnload);

            // Document-level delegation for native events
            Events.on(document, 'click', '[data-request]', this.onTriggerEvent);
            Events.on(document, 'submit', '[data-request]', this.onTriggerEvent);
            Events.on(document, 'change', '[data-request]', this.onTriggerEvent);
            Events.on(document, 'input', '[data-request]', this.onTriggerEvent);

            // Custom event for invented triggers (load, revealed, intersect, poll)
            Events.on(document, 'ajax:trigger', '[data-request]', this.onTriggerEvent);

            // First page load
            addEventListener('DOMContentLoaded', this.onRender);

            // Again, after new scripts load
            addEventListener('page:updated', this.onRender);

            // Again after AJAX request
            addEventListener('ajax:update-complete', this.onRender);

            this.started = true;
        }
    }

    stop() {
        if (this.started) {
            removeEventListener('beforeunload', this.documentOnBeforeUnload);

            Events.off(document, 'click', '[data-request]', this.onTriggerEvent);
            Events.off(document, 'submit', '[data-request]', this.onTriggerEvent);
            Events.off(document, 'change', '[data-request]', this.onTriggerEvent);
            Events.off(document, 'input', '[data-request]', this.onTriggerEvent);
            Events.off(document, 'ajax:trigger', '[data-request]', this.onTriggerEvent);

            removeEventListener('DOMContentLoaded', this.onRender);
            removeEventListener('page:updated', this.onRender);
            removeEventListener('ajax:update-complete', this.onRender);

            this.started = false;
        }
    }

    onRender = () => {
        this.render();
    }

    render() {
        // Pre render event, used to move nodes around
        Events.dispatch('before-render');

        // Render event, used to initialize controls
        Events.dispatch('render');

        // Resize event to adjust all measurements
        dispatchEvent(new Event('resize'));

        this.bindCustomTriggers();
    }

    /**
     * Initialize triggers for custom events (load, revealed, intersect)
     * Native events (click, submit, change, input) are handled by document delegation
     */
    bindCustomTriggers() {
        document.querySelectorAll('[data-request]:not([data-trigger-bound])').forEach(el => {
            const trigger = this.getTrigger(el);
            const eventType = trigger.config.event;

            // Only bind directly for custom events
            if (eventType === 'load' || eventType === 'revealed' || eventType === 'intersect') {
                el.setAttribute('data-trigger-bound', '');
                trigger.bind();
            }

            // Setup polling if configured (works with any event type)
            if (trigger.config.poll > 0) {
                el.setAttribute('data-trigger-bound', '');
                trigger.startPolling();
            }
        });
    }

    /**
     * Get or create a Trigger instance for an element
     */
    getTrigger(el) {
        let trigger = this.triggers.get(el);
        if (!trigger) {
            trigger = new Trigger(el);
            this.triggers.set(el, trigger);
        }
        return trigger;
    }

    /**
     * Handle delegated trigger events
     */
    onTriggerEvent = (event) => {
        const el = event.delegateTarget;
        const trigger = this.getTrigger(el);
        const configEvent = trigger.config.event;

        // For ajax:trigger (invented events), always handle
        if (event.type === 'ajax:trigger') {
            trigger.handleEvent(event);
            return;
        }

        // For native events, only handle if it matches the configured trigger event
        if (event.type === configEvent) {
            trigger.handleEvent(event);
        }
    }

    documentOnBeforeUnload(event) {
        window.jaxUnloading = true;
    }

    /**
     * Wait for the page to be ready.
     * Uses Turbo's pageReady if available, otherwise falls back to domReady.
     */
    pageReady() {
        return turboPageReady() ?? domReady();
    }
}
