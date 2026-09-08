import { ValueListObserver } from "./mutation";

export class ScopeObserver
{
    constructor(element, delegate) {
        this.element = element;
        this.delegate = delegate;
        this.valueListObserver = new ValueListObserver(this.element, this.controlAttribute, this);
        this.scopesByIdentifierByElement = new WeakMap();
        this.scopeReferenceCounts = new WeakMap();
        this.parkedScopesByElement = new Map();
        this.parkedElementsByBoundary = new Map();
        this.boundaryByElement = new Map();
        this.intersectionObserver = null;
    }

    start() {
        this.valueListObserver.start();
    }

    stop() {
        this.valueListObserver.stop();
        this.stopParkedScopes();
    }

    get controlAttribute() {
        return 'data-control';
    }

    get lazyAttribute() {
        return 'data-lazy-controls';
    }

    // Value observer delegate
    parseValueForToken(token) {
        const { element, content: identifier } = token;
        const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
        let scope = scopesByIdentifier.get(identifier);
        if (!scope) {
            scope = this.delegate.createScopeForElementAndIdentifier(element, identifier);
            scopesByIdentifier.set(identifier, scope);
        }
        return scope;
    }

    elementMatchedValue(element, value) {
        const boundary = this.findLazyBoundary(element);
        if (boundary) {
            this.parkScope(element, value, boundary);
            return;
        }
        this.connectScope(value);
    }

    elementUnmatchedValue(element, value) {
        if (this.unparkScope(element, value)) {
            return;
        }
        const referenceCount = this.scopeReferenceCounts.get(value);
        if (referenceCount) {
            this.scopeReferenceCounts.set(value, referenceCount - 1);
            if (referenceCount == 1) {
                this.delegate.scopeDisconnected(value);
            }
        }
    }

    connectScope(value) {
        const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
        this.scopeReferenceCounts.set(value, referenceCount);
        if (referenceCount == 1) {
            this.delegate.scopeConnected(value);
        }
    }

    fetchScopesByIdentifierForElement(element) {
        let scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
        if (!scopesByIdentifier) {
            scopesByIdentifier = new Map();
            this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
        }
        return scopesByIdentifier;
    }

    // Parked scopes wait for their lazy boundary to become visible
    findLazyBoundary(element) {
        if (typeof IntersectionObserver === 'undefined' || typeof element.closest !== 'function') {
            return null;
        }
        return element.closest('[' + this.lazyAttribute + ']');
    }

    parkScope(element, value, boundary) {
        let scopes = this.parkedScopesByElement.get(element);
        if (!scopes) {
            scopes = new Set();
            this.parkedScopesByElement.set(element, scopes);
            this.boundaryByElement.set(element, boundary);

            let elements = this.parkedElementsByBoundary.get(boundary);
            if (!elements) {
                elements = new Set();
                this.parkedElementsByBoundary.set(boundary, elements);
                this.fetchIntersectionObserver().observe(boundary);
            }
            elements.add(element);
        }
        scopes.add(value);
    }

    unparkScope(element, value) {
        const scopes = this.parkedScopesByElement.get(element);
        if (!scopes || !scopes.has(value)) {
            return false;
        }
        scopes.delete(value);
        if (!scopes.size) {
            this.forgetParkedElement(element);
        }
        return true;
    }

    forgetParkedElement(element) {
        this.parkedScopesByElement.delete(element);
        const boundary = this.boundaryByElement.get(element);
        this.boundaryByElement.delete(element);

        const elements = this.parkedElementsByBoundary.get(boundary);
        if (elements) {
            elements.delete(element);
            if (!elements.size) {
                this.parkedElementsByBoundary.delete(boundary);
                if (this.intersectionObserver) {
                    this.intersectionObserver.unobserve(boundary);
                }
            }
        }
    }

    fetchIntersectionObserver() {
        if (!this.intersectionObserver) {
            this.intersectionObserver = new IntersectionObserver((entries) => this.processIntersections(entries));
        }
        return this.intersectionObserver;
    }

    processIntersections(entries) {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                this.activateBoundary(entry.target);
            }
        }
    }

    activateBoundary(boundary) {
        const elements = this.parkedElementsByBoundary.get(boundary);
        if (!elements) {
            return;
        }

        this.parkedElementsByBoundary.delete(boundary);
        if (this.intersectionObserver) {
            this.intersectionObserver.unobserve(boundary);
        }

        for (const element of Array.from(elements)) {
            const scopes = this.parkedScopesByElement.get(element);
            this.parkedScopesByElement.delete(element);
            this.boundaryByElement.delete(element);
            if (scopes) {
                for (const value of scopes) {
                    this.connectScope(value);
                }
            }
        }
    }

    stopParkedScopes() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        this.parkedScopesByElement.clear();
        this.parkedElementsByBoundary.clear();
        this.boundaryByElement.clear();
    }
}
