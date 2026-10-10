import { Module } from "./module";
import { Scope } from "./scope";
import { ScopeObserver } from "./scope-observer";
import { Multimap } from "./util/multimap";

export class Container
{
    constructor(application) {
        this.application = application;
        this.scopeObserver = new ScopeObserver(this.element, this);
        this.scopesByIdentifier = new Multimap();
        this.modulesByIdentifier = new Map();
        this.loadersByIdentifier = new Map();
    }

    get element() {
        return this.application.element;
    }

    get modules() {
        return Array.from(this.modulesByIdentifier.values());
    }

    get contexts() {
        return this.modules.reduce((contexts, module) => contexts.concat(module.contexts), []);
    }

    start() {
        this.scopeObserver.start();
    }

    stop() {
        this.scopeObserver.stop();
    }

    loadDefinition(definition) {
        this.unloadIdentifier(definition.identifier);
        const module = new Module(this.application, definition);
        this.connectModule(module);
        const afterLoad = definition.controlConstructor.afterLoad;
        if (afterLoad) {
            afterLoad.call(definition.controlConstructor, definition.identifier, this.application);
        }
    }

    registerLoader(identifier, loader) {
        this.unloadIdentifier(identifier);
        this.loadersByIdentifier.set(identifier, { loader, promise: null });
        if (this.scopesByIdentifier.hasKey(identifier)) {
            this.runLoader(identifier);
        }
    }

    unloadIdentifier(identifier) {
        this.loadersByIdentifier.delete(identifier);
        const module = this.modulesByIdentifier.get(identifier);
        if (module) {
            this.disconnectModule(module);
        }
    }

    getModuleForIdentifier(identifier) {
        return this.modulesByIdentifier.get(identifier);
    }

    getContextForElementAndIdentifier(element, identifier) {
        const module = this.modulesByIdentifier.get(identifier);
        if (module) {
            return module.contexts.find((context) => context.element == element);
        }
    }

    // Error handler delegate
    handleError(error, message, detail) {
        this.application.handleError(error, message, detail);
    }

    // Scope observer delegate
    createScopeForElementAndIdentifier(element, identifier) {
        return new Scope(element, identifier);
    }

    scopeConnected(scope) {
        this.scopesByIdentifier.add(scope.identifier, scope);
        const module = this.modulesByIdentifier.get(scope.identifier);
        if (module) {
            module.connectContextForScope(scope);
        }
        else if (this.loadersByIdentifier.has(scope.identifier)) {
            this.runLoader(scope.identifier);
        }
    }

    scopeDisconnected(scope) {
        this.scopesByIdentifier.delete(scope.identifier, scope);
        const module = this.modulesByIdentifier.get(scope.identifier);
        if (module) {
            module.disconnectContextForScope(scope);
        }
    }

    // Loaders import their control once, when its first element connects
    runLoader(identifier) {
        const entry = this.loadersByIdentifier.get(identifier);
        if (entry.promise) {
            return;
        }

        entry.promise = Promise.resolve()
            .then(() => entry.loader())
            .then((result) => {
                const control = result?.default || result;
                if (typeof control !== 'function' || !('shouldLoad' in control)) {
                    throw new Error(`Loader for control "${identifier}" did not return a control class`);
                }

                // Skip if the identifier was registered again or unloaded meanwhile
                if (this.loadersByIdentifier.get(identifier) === entry) {
                    this.application.register(identifier, control);
                }
            })
            .catch((error) => {
                this.handleError(error, `Error loading control "${identifier}"`, { identifier });
            });
    }

    // Modules
    connectModule(module) {
        this.modulesByIdentifier.set(module.identifier, module);
        const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
        scopes.forEach((scope) => module.connectContextForScope(scope));
    }

    disconnectModule(module) {
        this.modulesByIdentifier.delete(module.identifier);
        const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
        scopes.forEach((scope) => module.disconnectContextForScope(scope));
    }
}
