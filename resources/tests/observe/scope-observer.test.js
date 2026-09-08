import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { ScopeObserver } from '../../src/observe/scope-observer';

// Delegate recording scope connections in order
class TestDelegate {
    constructor() {
        this.log = [];
    }

    createScopeForElementAndIdentifier(element, identifier) {
        return { element, identifier };
    }

    scopeConnected(scope) {
        this.log.push('connect:' + scope.element.id + ':' + scope.identifier);
    }

    scopeDisconnected(scope) {
        this.log.push('disconnect:' + scope.element.id + ':' + scope.identifier);
    }
}

// Deterministic IntersectionObserver replacement, triggered via intersect()
class FakeIntersectionObserver {
    static instances = [];

    constructor(callback) {
        this.callback = callback;
        this.observed = new Set();
        FakeIntersectionObserver.instances.push(this);
    }

    observe(element) {
        this.observed.add(element);
    }

    unobserve(element) {
        this.observed.delete(element);
    }

    disconnect() {
        this.observed.clear();
    }

    static intersect(element) {
        for (const instance of FakeIntersectionObserver.instances) {
            if (instance.observed.has(element)) {
                instance.callback([{ target: element, isIntersecting: true }], instance);
            }
        }
    }
}

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeControl(id, identifier = 'test') {
    const el = document.createElement('div');
    el.id = id;
    el.setAttribute('data-control', identifier);
    return el;
}

function makeBoundary() {
    const el = document.createElement('div');
    el.setAttribute('data-lazy-controls', '');
    return el;
}

async function withObserver(fn) {
    const sandbox = document.createElement('div');
    document.body.appendChild(sandbox);
    const delegate = new TestDelegate();
    const observer = new ScopeObserver(sandbox, delegate);
    try {
        await fn(sandbox, delegate, observer);
    }
    finally {
        observer.stop();
        sandbox.remove();
    }
}

describe('ScopeObserver', () => {
    let realIntersectionObserver;

    beforeAll(() => {
        realIntersectionObserver = globalThis.IntersectionObserver;
        globalThis.IntersectionObserver = FakeIntersectionObserver;
    });

    afterAll(() => {
        globalThis.IntersectionObserver = realIntersectionObserver;
    });

    it('connects controls outside a lazy boundary on start', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            sandbox.appendChild(makeControl('a'));
            observer.start();
            expect(delegate.log).toEqual(['connect:a:test']);
        });
    });

    it('parks controls inside a lazy boundary on start', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const boundary = makeBoundary();
            boundary.appendChild(makeControl('a'));
            sandbox.appendChild(boundary);
            observer.start();
            expect(delegate.log).toEqual([]);
        });
    });

    it('connects parked controls when their boundary becomes visible', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const boundary = makeBoundary();
            boundary.appendChild(makeControl('a'));
            boundary.appendChild(makeControl('b'));
            sandbox.appendChild(boundary);
            observer.start();

            FakeIntersectionObserver.intersect(boundary);
            expect(delegate.log).toEqual(['connect:a:test', 'connect:b:test']);

            // A second intersection must not connect twice
            FakeIntersectionObserver.intersect(boundary);
            expect(delegate.log).toEqual(['connect:a:test', 'connect:b:test']);
        });
    });

    it('connects every identifier of a parked element on activation', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const boundary = makeBoundary();
            boundary.appendChild(makeControl('a', 'alpha beta'));
            sandbox.appendChild(boundary);
            observer.start();
            expect(delegate.log).toEqual([]);

            FakeIntersectionObserver.intersect(boundary);
            expect(delegate.log).toEqual(['connect:a:alpha', 'connect:a:beta']);
        });
    });

    it('parks controls added inside a lazy boundary after start', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const boundary = makeBoundary();
            sandbox.appendChild(boundary);
            observer.start();

            boundary.appendChild(makeControl('a'));
            await nextTask();
            expect(delegate.log).toEqual([]);

            FakeIntersectionObserver.intersect(boundary);
            expect(delegate.log).toEqual(['connect:a:test']);
        });
    });

    it('never connects a parked control removed before activation', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const boundary = makeBoundary();
            const el = makeControl('a');
            boundary.appendChild(el);
            sandbox.appendChild(boundary);
            observer.start();

            el.remove();
            await nextTask();

            FakeIntersectionObserver.intersect(boundary);
            expect(delegate.log).toEqual([]);
        });
    });

    it('keeps inner boundaries parked when an outer boundary activates', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const outer = makeBoundary();
            const inner = makeBoundary();
            outer.appendChild(makeControl('a'));
            inner.appendChild(makeControl('b'));
            outer.appendChild(inner);
            sandbox.appendChild(outer);
            observer.start();

            FakeIntersectionObserver.intersect(outer);
            expect(delegate.log).toEqual(['connect:a:test']);

            FakeIntersectionObserver.intersect(inner);
            expect(delegate.log).toEqual(['connect:a:test', 'connect:b:test']);
        });
    });

    it('disconnects activated controls when they are removed', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const boundary = makeBoundary();
            const el = makeControl('a');
            boundary.appendChild(el);
            sandbox.appendChild(boundary);
            observer.start();

            FakeIntersectionObserver.intersect(boundary);
            el.remove();
            await nextTask();
            expect(delegate.log).toEqual(['connect:a:test', 'disconnect:a:test']);
        });
    });

    it('ignores intersections after stop', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const boundary = makeBoundary();
            boundary.appendChild(makeControl('a'));
            sandbox.appendChild(boundary);
            observer.start();
            observer.stop();

            FakeIntersectionObserver.intersect(boundary);
            expect(delegate.log).toEqual([]);
        });
    });

    it('connects controls immediately when IntersectionObserver is unavailable', async () => {
        const saved = globalThis.IntersectionObserver;
        delete globalThis.IntersectionObserver;
        try {
            await withObserver(async (sandbox, delegate, observer) => {
                const boundary = makeBoundary();
                boundary.appendChild(makeControl('a'));
                sandbox.appendChild(boundary);
                observer.start();
                expect(delegate.log).toEqual(['connect:a:test']);
            });
        }
        finally {
            globalThis.IntersectionObserver = saved;
        }
    });
});
