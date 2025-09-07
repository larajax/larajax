import { Dispatcher } from "./dispatcher";
import { Container } from "./container";
import { domReady } from "../util/wait";

export class Application
{
    constructor() {
        this.started = false;
        this.element = document.documentElement;
        this.dispatcher = new Dispatcher(this);
        this.container = new Container(this);
    }

    startAsync() {
        domReady().then(() => {
            this.start();
        });
    }

    start() {
        if (!this.started) {
            this.started = true;
            this.dispatcher.start();
            this.container.start();
        }
    }

    stop() {
        if (this.started) {
            this.dispatcher.stop();
            this.container.stop();
            this.started = false;
        }
    }

    register(identifier, controlConstructor) {
        this.load({ identifier, controlConstructor });
    }

    observe(element, identifier) {
        const observer = this.container.scopeObserver;
        observer.elementMatchedValue(element, observer.parseValueForToken({
            element,
            content: identifier
        }));

        const foundControl = this.getControlForElementAndIdentifier(element, identifier);
        if (!element.matches(`[data-control~="${identifier}"]`)) {
            element.dataset.control = ((element.dataset.control || '') + ' ' + identifier).trim();
        }
        return foundControl;
    }

    import(identifier) {
        const module = this.container.getModuleForIdentifier(identifier);
        if (!module) {
            throw new Error(`Control is not registered [${identifier}]`);
        }

        return module.controlConstructor;
    }

    fetch(element, identifier) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!identifier) {
            identifier = element.dataset.control;
        }

        return element
            ? this.getControlForElementAndIdentifier(element, identifier)
            : null;
    }

    fetchAll(elements, identifier) {
        if (typeof elements === 'string') {
            elements = document.querySelectorAll(elements);
        }

        const result = [];
        elements.forEach((element) => {
            const control = this.fetch(element, identifier);
            if (control) {
                result.push(control);
            }
        });
        return result;
    }

    load(head, ...rest) {
        const definitions = Array.isArray(head) ? head : [head, ...rest];
        definitions.forEach((definition) => {
            if (definition.controlConstructor.shouldLoad) {
                this.container.loadDefinition(definition);
            }
        });
    }

    unload(head, ...rest) {
        const identifiers = Array.isArray(head) ? head : [head, ...rest];
        identifiers.forEach((identifier) => this.container.unloadIdentifier(identifier));
    }

    // Controls
    get controls() {
        return this.container.contexts.map((context) => context.control);
    }

    getControlForElementAndIdentifier(element, identifier) {
        const context = this.container.getContextForElementAndIdentifier(element, identifier);
        return context ? context.control : null;
    }

    // Error handling
    handleError(error, message, detail) {
        var _a;
        console.error(`%s\n\n%o\n\n%o`, message, error, detail);
        (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, message, "", 0, 0, error);
    }
}
