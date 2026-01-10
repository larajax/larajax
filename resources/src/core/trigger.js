import { RequestBuilder } from "./request-builder";
import { dispatch } from "../util";

export class Trigger
{
    constructor(element) {
        this.element = element;
        this.config = this.parse();
        this.timer = null;
        this.throttleTimer = null;
        this.lastValue = null;
        this.fired = false;
        this.throttled = false;
        this.lastRequest = null;
    }

    /**
     * Parse trigger configuration from element attributes
     */
    parse() {
        let trigger = this.element.dataset.requestTrigger;
        let poll = this.element.dataset.requestPoll;

        // Backwards compat: data-track-input
        if (!trigger && this.element.dataset.trackInput !== undefined) {
            const delay = this.element.dataset.trackInput || 300;
            trigger = `input changed delay:${delay}`;
        }

        // Backwards compat: data-auto-submit
        if (!trigger && this.element.dataset.autoSubmit !== undefined) {
            const delay = this.element.dataset.autoSubmit || 0;
            trigger = delay > 0 ? `load delay:${delay}` : 'load';
        }

        // Default trigger based on element type
        if (!trigger) {
            trigger = this.getDefaultTrigger();
        }

        const config = this.parseString(trigger);

        // Handle polling separately
        if (poll) {
            config.poll = this.parseTime(poll);
        }

        return config;
    }

    /**
     * Parse trigger string into config object
     * Format: "event modifier modifier:value"
     * Example: "input changed delay:500"
     */
    parseString(str) {
        const parts = str.trim().split(/\s+/);
        const config = {
            event: parts[0] || 'click',
            delay: 0,
            throttle: 0,
            once: false,
            changed: false,
            poll: 0
        };

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (part === 'once') {
                config.once = true;
            }
            else if (part === 'changed') {
                config.changed = true;
            }
            else if (part.startsWith('delay:')) {
                config.delay = this.parseTime(part.slice(6));
            }
            else if (part.startsWith('throttle:')) {
                config.throttle = this.parseTime(part.slice(9));
            }
        }

        return config;
    }

    /**
     * Parse time value to milliseconds
     * Supports: 500, 500ms, 1s, 1.5s
     */
    parseTime(value) {
        if (typeof value === 'number') {
            return value;
        }

        value = String(value).trim();

        if (value.endsWith('ms')) {
            return parseFloat(value);
        }
        if (value.endsWith('s')) {
            return parseFloat(value) * 1000;
        }

        return parseInt(value, 10) || 0;
    }

    /**
     * Get default trigger based on element type
     */
    getDefaultTrigger() {
        const el = this.element;
        const tag = el.tagName.toLowerCase();
        const type = el.getAttribute('type')?.toLowerCase();

        if (tag === 'form') return 'submit';
        if (tag === 'a') return 'click';
        if (tag === 'button') return 'click';
        if (tag === 'select') return 'change';
        if (type === 'checkbox' || type === 'radio' || type === 'file') return 'change';
        if (tag === 'input' && (type === 'submit' || type === 'button')) return 'click';
        if (tag === 'input') return 'click';

        return 'click';
    }

    /**
     * Check if element is still connected to DOM
     */
    isConnected() {
        return this.element.isConnected;
    }

    /**
     * Bind event listeners for invented events only.
     * Standard DOM events (click, submit, change, input) are handled
     * via document-level delegation in Controller.
     */
    bind() {
        const { event } = this.config;

        // Invented events that need direct binding
        if (event === 'load') {
            dispatch('ajax:trigger', { target: this.element });
        }
        else if (event === 'revealed' || event === 'intersect') {
            this.observeVisibility();
        }
    }

    /**
     * Handle the trigger event
     */
    handleEvent(event) {
        // User already prevented this event, respect it
        if (event && event.defaultPrevented) {
            return;
        }

        // Element removed from DOM, ignore
        if (!this.isConnected()) {
            return;
        }

        // Prevent default for certain events
        if (event && (this.config.event === 'submit' || this.config.event === 'click')) {
            event.preventDefault();
        }

        const { delay, throttle, once, changed } = this.config;

        // Once: already fired, ignore
        if (once && this.fired) {
            return;
        }

        // Changed: only fire if value changed
        if (changed && !this.hasChanged()) {
            return;
        }

        // Clear any pending delay timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        // Throttle: ignore if within throttle window
        if (throttle > 0 && this.throttled) {
            return;
        }

        // Delay: debounce the request
        if (delay > 0) {
            this.timer = setTimeout(() => this.fire(), delay);
        }
        else {
            this.fire();
        }
    }

    /**
     * Check if the element value has changed
     */
    hasChanged() {
        const value = this.element.value;
        if (this.lastValue === value) {
            return false;
        }
        this.lastValue = value;
        return true;
    }

    /**
     * Fire the actual request
     */
    fire() {
        // Element removed from DOM, don't fire
        if (!this.isConnected()) {
            return;
        }

        // Abort previous request if still pending
        if (this.lastRequest && this.lastRequest.abort) {
            this.lastRequest.abort();
        }

        this.fired = true;
        this.lastRequest = RequestBuilder.fromElement(this.element);

        // Setup throttle window
        if (this.config.throttle > 0) {
            this.throttled = true;
            this.throttleTimer = setTimeout(() => {
                this.throttled = false;
            }, this.config.throttle);
        }
    }

    /**
     * Observe element visibility for revealed/intersect events
     */
    observeVisibility() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Element removed, disconnect
                if (!this.isConnected()) {
                    observer.disconnect();
                    return;
                }

                if (entry.isIntersecting) {
                    dispatch('ajax:trigger', { target: this.element });
                    if (this.config.once || this.config.event === 'intersect') {
                        observer.disconnect();
                    }
                }
            });
        }, {
            threshold: 0.1
        });

        observer.observe(this.element);
    }

    /**
     * Start polling interval
     */
    startPolling() {
        const intervalId = setInterval(() => {
            // Element removed from DOM, stop polling
            if (!this.isConnected()) {
                clearInterval(intervalId);
                return;
            }

            // Only fire when page is visible
            if (!document.hidden) {
                dispatch('ajax:trigger', { target: this.element });
            }
        }, this.config.poll);
    }
}
