// Decorate an async/function so that calling it returns a jQuery-style promise
export function decoratePromiseProxy(fn, ctx = null) {
    return (...args) => {
        // Ensure sync throws also become rejections
        const p = Promise.resolve().then(() => fn.apply(ctx, args));
        return makeDeferredCompat(p);
    };
}

export function decoratePromise(promise) {
    return Object.assign(promise, {
        done(fn) { promise.then(fn); return this; },
        fail(fn) { promise.catch(fn); return this; },
        always(fn) { promise.finally(fn); return this; }
    });
}

export function cancellablePromise(executor) {
    if (!executor) {
        executor = () => {}
    }

    let hasCanceled = false;
    let cancelHandler = () => {};
    let resolveFn, rejectFn;

    const promise = new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;

        executor(
            (value) => {
                if (!hasCanceled) resolve(value);
            },
            (error) => {
                if (!hasCanceled) reject(error);
            },
            (onCancel) => {
                cancelHandler = onCancel;
            }
        );
    });

    promise.cancel = () => {
        hasCanceled = true;
        cancelHandler();
    };

    promise.onCancel = (fn) => {
        cancelHandler = typeof fn === 'function' ? fn : cancelHandler;
        return promise;
    };

    promise.resolve = (value) => {
        if (!hasCanceled) {
            resolveFn(value);
        }
    };

    promise.reject = (error) => {
        if (!hasCanceled) {
            rejectFn(error);
        }
    };

    return decoratePromise(promise);
}
