import { describe, it, expect } from 'bun:test';
import { cancellablePromise, decoratePromise, decoratePromiseProxy } from '../../src/util/promise';

describe('decoratePromise', () => {
    it('adds done/fail/always methods', () => {
        const p = decoratePromise(Promise.resolve());
        expect(typeof p.done).toBe('function');
        expect(typeof p.fail).toBe('function');
        expect(typeof p.always).toBe('function');
    });

    it('done is called on resolve', async () => {
        let result = null;
        const p = decoratePromise(Promise.resolve('value'));
        p.done((v) => { result = v; });
        await p;
        await new Promise(r => setTimeout(r, 0));
        expect(result).toBe('value');
    });

    it('fail is called on reject', async () => {
        let result = null;
        const p = decoratePromise(Promise.reject('error'));
        p.fail((e) => { result = e; });
        await new Promise(r => setTimeout(r, 0));
        expect(result).toBe('error');
    });

    it('always is called regardless of outcome', async () => {
        let called = false;
        const p = decoratePromise(Promise.resolve());
        p.always(() => { called = true; });
        await p;
        await new Promise(r => setTimeout(r, 0));
        expect(called).toBe(true);
    });

    it('supports chaining', () => {
        const p = decoratePromise(Promise.resolve());
        const result = p.done(() => {}).fail(() => {}).always(() => {});
        expect(result).toBe(p);
    });
});

describe('decoratePromiseProxy', () => {
    it('wraps a function to return a decorated promise', async () => {
        const fn = (x) => x * 2;
        const proxy = decoratePromiseProxy(fn);
        const result = await proxy(5);
        expect(result).toBe(10);
    });

    it('converts sync throws to rejections', async () => {
        const fn = () => { throw new Error('sync error'); };
        const proxy = decoratePromiseProxy(fn);
        let caught = null;
        try {
            await proxy();
        } catch (e) {
            caught = e;
        }
        expect(caught).not.toBeNull();
        expect(caught.message).toBe('sync error');
    });

    it('wraps async functions', async () => {
        const fn = async (x) => x + 1;
        const proxy = decoratePromiseProxy(fn);
        const result = await proxy(10);
        expect(result).toBe(11);
    });

    it('returns promise with done/fail/always', () => {
        const fn = () => 'ok';
        const proxy = decoratePromiseProxy(fn);
        const p = proxy();
        expect(typeof p.done).toBe('function');
        expect(typeof p.fail).toBe('function');
        expect(typeof p.always).toBe('function');
    });
});

describe('cancellablePromise', () => {
    it('resolves normally when not cancelled', async () => {
        const p = cancellablePromise((resolve) => {
            resolve('done');
        });
        const result = await p;
        expect(result).toBe('done');
    });

    it('prevents resolve after cancel', async () => {
        let resolveFn;
        const p = cancellablePromise((resolve) => {
            resolveFn = resolve;
        });

        p.cancel();
        resolveFn('should-not-resolve');

        // The promise should never resolve, so we race with a timeout
        const result = await Promise.race([
            p.then(() => 'resolved'),
            new Promise(r => setTimeout(() => r('timeout'), 50))
        ]);
        expect(result).toBe('timeout');
    });

    it('prevents reject after cancel', async () => {
        let rejectFn;
        const p = cancellablePromise((_, reject) => {
            rejectFn = reject;
        });

        p.cancel();
        rejectFn('should-not-reject');

        const result = await Promise.race([
            p.catch(() => 'rejected'),
            new Promise(r => setTimeout(() => r('timeout'), 50))
        ]);
        expect(result).toBe('timeout');
    });

    it('calls onCancel handler when cancelled', () => {
        let cancelCalled = false;
        const p = cancellablePromise((resolve, reject, onCancel) => {
            onCancel(() => { cancelCalled = true; });
        });
        p.cancel();
        expect(cancelCalled).toBe(true);
    });

    it('abort is an alias for cancel', () => {
        let cancelCalled = false;
        const p = cancellablePromise((resolve, reject, onCancel) => {
            onCancel(() => { cancelCalled = true; });
        });
        p.abort();
        expect(cancelCalled).toBe(true);
    });

    it('onCancel returns the promise for chaining', () => {
        const p = cancellablePromise();
        const result = p.onCancel(() => {});
        expect(result).toBe(p);
    });

    it('external resolve works', async () => {
        const p = cancellablePromise();
        p.resolve('external');
        const result = await p;
        expect(result).toBe('external');
    });

    it('external reject works', async () => {
        const p = cancellablePromise();
        p.reject('external-error');
        let caught = null;
        try { await p; } catch (e) { caught = e; }
        expect(caught).toBe('external-error');
    });

    it('external resolve blocked after cancel', () => {
        const p = cancellablePromise();
        p.cancel();
        // Should not throw, just silently ignore
        p.resolve('ignored');
        p.reject('also-ignored');
    });

    it('has done/fail/always methods', () => {
        const p = cancellablePromise();
        expect(typeof p.done).toBe('function');
        expect(typeof p.fail).toBe('function');
        expect(typeof p.always).toBe('function');
    });

    it('works with no executor', async () => {
        const p = cancellablePromise();
        p.resolve('no-executor');
        const result = await p;
        expect(result).toBe('no-executor');
    });
});
