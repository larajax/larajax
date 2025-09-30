import { Context } from "./context";

export class Module
{
    constructor(application, definition) {
        this.application = application;
        this.definition = blessDefinition(definition);
        this.contextsByScope = new WeakMap();
        this.connectedContexts = new Set();
    }

    get identifier() {
        return this.definition.identifier;
    }

    get controlConstructor() {
        return this.definition.controlConstructor;
    }

    get contexts() {
        return Array.from(this.connectedContexts);
    }

    connectContextForScope(scope) {
        const context = this.fetchContextForScope(scope);
        this.connectedContexts.add(context);
        context.connect();
    }

    disconnectContextForScope(scope) {
        const context = this.contextsByScope.get(scope);
        if (context) {
            this.connectedContexts.delete(context);
            context.disconnect();
        }
    }

    fetchContextForScope(scope) {
        let context = this.contextsByScope.get(scope);
        if (!context) {
            context = new Context(this, scope);
            this.contextsByScope.set(scope, context);
        }
        return context;
    }
}

function blessDefinition(definition) {
    return {
        identifier: definition.identifier,
        controlConstructor: definition.controlConstructor,
    };
}
