import { describe, it, expect } from 'bun:test';
import { Application } from '../../src/observe/application';
import { ControlBase } from '../../src/observe/control-base';

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mutation delivery and the loader promise chain can span two tasks
const settle = () => nextTask().then(nextTask);

class TestControl extends ControlBase {
    connect() {
        this.element.dataset.connected = 'test';
    }
}

class OtherControl extends ControlBase {
    connect() {
        this.element.dataset.connected = 'other';
    }
}

function makeControl(identifier) {
    const el = document.createElement('div');
    el.setAttribute('data-control', identifier);
    return el;
}

function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

async function withApplication(fn) {
    const sandbox = document.createElement('div');
    document.body.appendChild(sandbox);
    const application = new Application;
    application.errors = [];
    application.handleError = (error, message) => application.errors.push(message);
    application.start();
    try {
        await fn(sandbox, application);
    }
    finally {
        application.stop();
        sandbox.remove();
    }
}

describe('Lazy controls', () => {
    it('imports the control once, when the first element connects', async () => {
        await withApplication(async (sandbox, application) => {
            let calls = 0;
            application.register('lazy-first', () => {
                calls++;
                return Promise.resolve({ default: TestControl });
            });
            await settle();
            expect(calls).toBe(0);

            const a = makeControl('lazy-first');
            const b = makeControl('lazy-first');
            sandbox.append(a, b);
            await settle();

            expect(calls).toBe(1);
            expect(a.dataset.connected).toBe('test');
            expect(b.dataset.connected).toBe('test');
        });
    });

    it('connects elements that exist before registration or arrive while loading', async () => {
        await withApplication(async (sandbox, application) => {
            const existing = makeControl('lazy-pending');
            sandbox.appendChild(existing);
            await settle();

            let calls = 0;
            const load = deferred();
            application.register('lazy-pending', () => {
                calls++;
                return load.promise;
            });
            await settle();
            expect(calls).toBe(1);

            const arriving = makeControl('lazy-pending');
            sandbox.appendChild(arriving);
            await settle();
            load.resolve(TestControl);
            await settle();

            expect(calls).toBe(1);
            expect(existing.dataset.connected).toBe('test');
            expect(arriving.dataset.connected).toBe('test');
        });
    });

    it('keeps a control registered while its loader was pending', async () => {
        await withApplication(async (sandbox, application) => {
            const load = deferred();
            application.register('lazy-replaced', () => load.promise);
            const el = makeControl('lazy-replaced');
            sandbox.appendChild(el);
            await settle();

            application.register('lazy-replaced', OtherControl);
            load.resolve(TestControl);
            await settle();

            expect(el.dataset.connected).toBe('other');
        });
    });

    it('reports a failed import once', async () => {
        await withApplication(async (sandbox, application) => {
            let calls = 0;
            application.register('lazy-failed', () => {
                calls++;
                return Promise.reject(new Error('Network error'));
            });
            const first = makeControl('lazy-failed');
            sandbox.appendChild(first);
            await settle();
            sandbox.appendChild(makeControl('lazy-failed'));
            await settle();

            expect(calls).toBe(1);
            expect(application.errors).toEqual(['Error loading control "lazy-failed"']);
            expect(first.dataset.connected).toBeUndefined();
        });
    });

    it('reports a loader that does not return a control', async () => {
        await withApplication(async (sandbox, application) => {
            application.register('lazy-named', () => Promise.resolve({ TestControl }));
            sandbox.appendChild(makeControl('lazy-named'));
            await settle();

            expect(application.errors).toEqual(['Error loading control "lazy-named"']);
        });
    });
});
