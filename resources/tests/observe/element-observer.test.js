import { describe, it, expect } from 'bun:test';
import { ElementObserver } from '../../src/observe/mutation/element-observer';

// Delegate recording matched/unmatched callbacks in order
class TestDelegate {
    constructor() {
        this.log = [];
    }

    matchElement(element) {
        return element.hasAttribute('data-test-control');
    }

    matchElementsInTree(tree) {
        const found = [];
        if (tree.nodeType === Node.ELEMENT_NODE && this.matchElement(tree)) {
            found.push(tree);
        }
        found.push(...tree.querySelectorAll('[data-test-control]'));
        return found;
    }

    elementMatched(element) {
        this.log.push('connect:' + element.id);
    }

    elementUnmatched(element) {
        this.log.push('disconnect:' + element.id);
    }
}

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeControl(id) {
    const el = document.createElement('div');
    el.id = id;
    el.setAttribute('data-test-control', '');
    return el;
}

async function withObserver(fn) {
    const sandbox = document.createElement('div');
    document.body.appendChild(sandbox);
    const delegate = new TestDelegate();
    const observer = new ElementObserver(sandbox, delegate);
    try {
        await fn(sandbox, delegate, observer);
    }
    finally {
        observer.stop();
        sandbox.remove();
    }
}

describe('ElementObserver', () => {
    it('connects matching elements present on start', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            sandbox.appendChild(makeControl('a'));
            observer.start();
            expect(delegate.log).toEqual(['connect:a']);
        });
    });

    it('connects added elements', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            observer.start();
            sandbox.appendChild(makeControl('a'));
            await nextTask();
            expect(delegate.log).toEqual(['connect:a']);
        });
    });

    it('disconnects removed elements', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const el = makeControl('a');
            sandbox.appendChild(el);
            observer.start();
            el.remove();
            await nextTask();
            expect(delegate.log).toEqual(['connect:a', 'disconnect:a']);
        });
    });

    it('keeps controls connected when moved within the root in the same task', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const groupOne = document.createElement('div');
            const groupTwo = document.createElement('div');
            const el = makeControl('a');
            groupOne.appendChild(el);
            sandbox.appendChild(groupOne);
            sandbox.appendChild(groupTwo);
            observer.start();

            // A synchronous move produces removal and addition records in one batch
            groupTwo.appendChild(el);
            await nextTask();
            expect(delegate.log).toEqual(['connect:a']);
        });
    });

    it('keeps descendant controls connected when their container moves', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const container = document.createElement('div');
            const target = document.createElement('div');
            container.appendChild(makeControl('a'));
            container.appendChild(makeControl('b'));
            sandbox.appendChild(container);
            sandbox.appendChild(target);
            observer.start();

            target.appendChild(container);
            await nextTask();
            expect(delegate.log).toEqual(['connect:a', 'connect:b']);
        });
    });

    it('keeps controls connected when reordered among siblings', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const first = makeControl('a');
            const second = makeControl('b');
            sandbox.appendChild(first);
            sandbox.appendChild(second);
            observer.start();

            sandbox.insertBefore(second, first);
            await nextTask();
            expect(delegate.log).toEqual(['connect:a', 'connect:b']);
        });
    });

    it('disconnects elements moved outside the root', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const el = makeControl('a');
            sandbox.appendChild(el);
            observer.start();

            document.body.appendChild(el);
            await nextTask();
            el.remove();
            expect(delegate.log).toEqual(['connect:a', 'disconnect:a']);
        });
    });

    it('disconnects and reconnects across separate tasks', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const el = makeControl('a');
            sandbox.appendChild(el);
            observer.start();

            el.remove();
            await nextTask();
            sandbox.appendChild(el);
            await nextTask();
            expect(delegate.log).toEqual(['connect:a', 'disconnect:a', 'connect:a']);
        });
    });

    it('disconnects descendant controls when their container is removed', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            const container = document.createElement('div');
            container.appendChild(makeControl('a'));
            container.appendChild(makeControl('b'));
            sandbox.appendChild(container);
            observer.start();

            container.remove();
            await nextTask();
            expect(delegate.log).toEqual(['connect:a', 'connect:b', 'disconnect:a', 'disconnect:b']);
        });
    });

    it('never connects transient elements added and removed in the same task', async () => {
        await withObserver(async (sandbox, delegate, observer) => {
            observer.start();
            const el = makeControl('a');
            sandbox.appendChild(el);
            el.remove();
            await nextTask();
            expect(delegate.log).toEqual([]);
        });
    });
});