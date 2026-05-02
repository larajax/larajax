import { describe, it, expect } from 'bun:test';
import { jax } from '../src/index';

describe('Namespace', () => {
    it('jax namespace exists', () => {
        expect(typeof jax).toBe('object');
        expect(jax).not.toBeNull();
    });
});

describe('Core API', () => {
    it('jax.ajax is a function', () => {
        expect(typeof jax.ajax).toBe('function');
    });

    it('jax.request is a function', () => {
        expect(typeof jax.request).toBe('function');
    });

    it('jax.AjaxRequest exists', () => {
        expect(typeof jax.AjaxRequest).toBe('function');
    });
});

describe('Utilities', () => {
    it('jax.parseJSON is a function', () => {
        expect(typeof jax.parseJSON).toBe('function');
    });

    it('jax.parseJSON parses valid JSON', () => {
        const result = jax.parseJSON('{"test": 123}');
        expect(result).toBeDefined();
        expect(result.test).toBe(123);
    });

    it('jax.values is a function', () => {
        expect(typeof jax.values).toBe('function');
    });

    it('jax.pageReady exists', () => {
        expect(jax.pageReady).toBeDefined();
    });

    it('jax.waitFor is a function', () => {
        expect(typeof jax.waitFor).toBe('function');
    });
});

describe('Event System', () => {
    it('jax.dispatch is a function', () => {
        expect(typeof jax.dispatch).toBe('function');
    });

    it('jax.trigger is a function', () => {
        expect(typeof jax.trigger).toBe('function');
    });

    it('jax.on is a function', () => {
        expect(typeof jax.on).toBe('function');
    });

    it('jax.off is a function', () => {
        expect(typeof jax.off).toBe('function');
    });

    it('jax.one is a function', () => {
        expect(typeof jax.one).toBe('function');
    });

    it('jax.dispatch fires events', () => {
        let fired = false;
        document.addEventListener('test-event-fw', () => { fired = true; });
        jax.dispatch('test-event-fw');
        expect(fired).toBe(true);
    });

    it('jax.on registers click listeners', () => {
        let clicked = false;
        const btn = document.createElement('button');
        document.body.appendChild(btn);
        jax.on(btn, 'click', () => { clicked = true; });
        btn.click();
        expect(clicked).toBe(true);
    });

    it('jax.one fires only once', () => {
        let count = 0;
        const btn = document.createElement('button');
        document.body.appendChild(btn);
        jax.one(btn, 'click', () => { count++; });
        btn.click();
        btn.click();
        btn.click();
        expect(count).toBe(1);
    });
});

describe('Extras', () => {
    it('jax.flashMsg is a function', () => {
        expect(typeof jax.flashMsg).toBe('function');
    });

    it('jax.progressBar exists', () => {
        expect(jax.progressBar).toBeDefined();
    });

    it('jax.attachLoader exists', () => {
        expect(jax.attachLoader).toBeDefined();
    });
});

describe('Control System', () => {
    it('jax.registerControl is a function', () => {
        expect(typeof jax.registerControl).toBe('function');
    });

    it('jax.importControl is a function', () => {
        expect(typeof jax.importControl).toBe('function');
    });

    it('jax.observeControl is a function', () => {
        expect(typeof jax.observeControl).toBe('function');
    });

    it('jax.fetchControl is a function', () => {
        expect(typeof jax.fetchControl).toBe('function');
    });

    it('jax.ControlBase exists', () => {
        expect(typeof jax.ControlBase).toBe('function');
    });

    it('custom control registration works', () => {
        class TestControl extends jax.ControlBase {
            init() { this.initialized = true; }
        }
        jax.registerControl('test-control-fw', TestControl);
    });
});

describe('Form Serialization', () => {
    it('jax.values serializes text inputs', () => {
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'username';
        input.value = 'testuser';
        form.appendChild(input);
        document.body.appendChild(form);
        const values = jax.values(form);
        expect(values.username).toBe('testuser');
    });

    it('jax.values serializes multiple fields', () => {
        const form = document.createElement('form');
        form.innerHTML = '<input type="text" name="name" value="John"><input type="email" name="email" value="john@test.com">';
        document.body.appendChild(form);
        const values = jax.values(form);
        expect(values.name).toBe('John');
        expect(values.email).toBe('john@test.com');
    });
});

describe('Turbo', () => {
    it('jax.useTurbo is a function', () => {
        expect(typeof jax.useTurbo).toBe('function');
    });

    it('jax.visit is a function', () => {
        expect(typeof jax.visit).toBe('function');
    });
});
