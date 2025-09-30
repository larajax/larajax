export class Context
{
    constructor(module, scope) {
        this.module = module;
        this.scope = scope;
        this.control = new module.controlConstructor(this);

        try {
            this.control.initBefore();
            this.control.init();
            this.control.initAfter();
        }
        catch (error) {
            this.handleError(error, 'initializing control');
        }
    }

    connect() {
        try {
            this.control.connectBefore();
            this.control.connect();
            this.control.connectAfter();
        }
        catch (error) {
            this.handleError(error, 'connecting control');
        }
    }

    refresh() {
    }

    disconnect() {
        try {
            this.control.disconnectBefore();
            this.control.disconnect();
            this.control.disconnectAfter();
        }
        catch (error) {
            this.handleError(error, 'disconnecting control');
        }
    }

    get application() {
        return this.module.application;
    }

    get identifier() {
        return this.module.identifier;
    }

    get dispatcher() {
        return this.application.dispatcher;
    }

    get element() {
        return this.scope.element;
    }

    get parentElement() {
        return this.element.parentElement;
    }

    // Error handling
    handleError(error, message, detail = {}) {
        const { identifier, control, element } = this;
        detail = Object.assign({ identifier, control, element }, detail);
        this.application.handleError(error, `Error ${message}`, detail);
    }
}
