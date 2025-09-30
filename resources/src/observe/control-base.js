
class ControlBase
{
    static proxyCounter = 0;

    static get shouldLoad() {
        return true;
    }

    static afterLoad(_identifier, _application) {
        return;
    }

    constructor(context) {
        this.context = context;

        this.config = { ...(context.scope.element.dataset || {}) };
    }

    get application() {
        return this.context.application;
    }

    get scope() {
        return this.context.scope;
    }

    get element() {
        return this.scope.element;
    }

    get identifier() {
        return this.scope.identifier;
    }

    init() {
        // Set up initial control state
    }

    connect() {
        // Control is connected to the DOM
    }

    disconnect() {
        // Control is disconnected from the DOM
    }

    // Internal events avoid the need to call parent logic
    initBefore() {
        this.proxiedEvents = {};
        this.proxiedMethods = {};
    }

    initAfter() {
    }

    connectBefore() {
    }

    connectAfter() {
    }

    disconnectBefore() {
    }

    disconnectAfter() {
        for (const key in this.proxiedEvents) {
            this.forget(...this.proxiedEvents[key]);
            delete this.proxiedEvents[key];
        }

        for (const key in this.proxiedMethods) {
            this.proxiedMethods[key] = undefined;
        }
    }

    // Events
    listen(eventName, targetOrHandler, handlerOrOptions, options) {
        if (typeof targetOrHandler === 'string') {
            oc.Events.on(this.element, eventName, targetOrHandler, this.proxy(handlerOrOptions), options);
        }
        else if (targetOrHandler instanceof Element) {
            oc.Events.on(targetOrHandler, eventName, this.proxy(handlerOrOptions), options);
        }
        else {
            oc.Events.on(this.element, eventName, this.proxy(targetOrHandler), handlerOrOptions);
        }

        // Automatic unbinding
        ControlBase.proxyCounter++;
        this.proxiedEvents[ControlBase.proxyCounter] = arguments;
    }

    forget(eventName, targetOrHandler, handlerOrOptions, options) {
        if (typeof targetOrHandler === 'string') {
            oc.Events.off(this.element, eventName, targetOrHandler, this.proxy(handlerOrOptions), options);
        }
        else if (targetOrHandler instanceof Element) {
            oc.Events.off(targetOrHandler, eventName, this.proxy(handlerOrOptions), options);
        }
        else {
            oc.Events.off(this.element, eventName, this.proxy(targetOrHandler), handlerOrOptions);
        }

        // Fills JS gap
        const compareArrays = (a, b) => {
            if (a.length === b.length) {
                for (var i = 0; i < a.length; i++) {
                    if (a[i] === b[i]) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Seeking GC
        for (const key in this.proxiedEvents) {
            if (compareArrays(arguments, this.proxiedEvents[key])) {
                delete this.proxiedEvents[key];
            }
        }
    }

    dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true, } = {}) {
        const type = prefix ? `${prefix}:${eventName}` : eventName;
        const event = new CustomEvent(type, { detail, bubbles, cancelable });
        target.dispatchEvent(event);
        return event;
    }

    proxy(method) {
        if (method.ocProxyId === undefined) {
            ControlBase.proxyCounter++;
            method.ocProxyId = ControlBase.proxyCounter;
        }

        if (this.proxiedMethods[method.ocProxyId] !== undefined) {
            return this.proxiedMethods[method.ocProxyId];
        }

        this.proxiedMethods[method.ocProxyId] = method.bind(this);

        return this.proxiedMethods[method.ocProxyId];
    }
}

export { ControlBase };
