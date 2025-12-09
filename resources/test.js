import { Window } from 'happy-dom';
import { readFileSync } from 'fs';
import { join } from 'path';

// Setup happy-dom
const window = new Window({
    url: 'http://localhost:3000/',
    width: 1024,
    height: 768
});

const document = window.document;
document.body.innerHTML = '<div id="app"></div>';

// Set up globals that the IIFE expects
globalThis.window = window;
globalThis.document = document;
globalThis.navigator = window.navigator;
globalThis.location = window.location;
globalThis.history = window.history;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.CustomEvent = window.CustomEvent;
globalThis.MouseEvent = window.MouseEvent;
globalThis.FormData = window.FormData;
globalThis.XMLHttpRequest = window.XMLHttpRequest;
globalThis.MutationObserver = window.MutationObserver;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.addEventListener = window.addEventListener.bind(window);
globalThis.removeEventListener = window.removeEventListener.bind(window);
globalThis.dispatchEvent = window.dispatchEvent.bind(window);

// Load and execute the framework
const frameworkPath = join(import.meta.dir, 'dist/framework-bundle.js');
const frameworkCode = readFileSync(frameworkPath, 'utf-8');

try {
    // The IIFE sets window.jax, we use indirect eval to run in global scope
    const indirectEval = eval;
    indirectEval(frameworkCode);
} catch (e) {
    console.log('\x1b[31mError loading framework:\x1b[0m', e.message);
    console.log(e.stack);
    process.exit(1);
}

// Wait for initialization
await new Promise(resolve => setTimeout(resolve, 100));

// Get jax - should be on globalThis.window now
const jax = globalThis.window.jax || globalThis.jax;

if (!jax) {
    console.log('\x1b[31mError: jax not found on window\x1b[0m');
    console.log('window.jax:', globalThis.window.jax);
    console.log('globalThis.jax:', globalThis.jax);
    process.exit(1);
}

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        const result = fn();
        if (result === true || result === undefined) {
            console.log(`\x1b[32m✓\x1b[0m ${name}`);
            passed++;
        } else {
            console.log(`\x1b[31m✗\x1b[0m ${name} (returned ${result})`);
            failed++;
        }
    } catch (e) {
        console.log(`\x1b[31m✗\x1b[0m ${name}`);
        console.log(`  \x1b[31m${e.message}\x1b[0m`);
        failed++;
    }
}

console.log('\n\x1b[1m=== Larajax Framework Tests (Happy-DOM) ===\x1b[0m\n');

// Namespace Tests
console.log('\x1b[36m--- Namespace ---\x1b[0m');
test('jax namespace exists', () => typeof jax === 'object' && jax !== null);

// Core API Tests
console.log('\n\x1b[36m--- Core API ---\x1b[0m');
test('jax.ajax is a function', () => typeof jax.ajax === 'function');
test('jax.request is a function', () => typeof jax.request === 'function');
test('jax.AjaxRequest exists', () => typeof jax.AjaxRequest === 'function');

// Utility Tests
console.log('\n\x1b[36m--- Utilities ---\x1b[0m');
test('jax.parseJSON is a function', () => typeof jax.parseJSON === 'function');
test('jax.parseJSON parses valid JSON', () => {
    const result = jax.parseJSON('{"test": 123}');
    return result && result.test === 123;
});
test('jax.values is a function', () => typeof jax.values === 'function');
test('jax.pageReady exists', () => jax.pageReady !== undefined);
test('jax.waitFor is a function', () => typeof jax.waitFor === 'function');

// Event System Tests
console.log('\n\x1b[36m--- Event System ---\x1b[0m');
test('jax.dispatch is a function', () => typeof jax.dispatch === 'function');
test('jax.trigger is a function', () => typeof jax.trigger === 'function');
test('jax.on is a function', () => typeof jax.on === 'function');
test('jax.off is a function', () => typeof jax.off === 'function');
test('jax.one is a function', () => typeof jax.one === 'function');

// Event Dispatch Test
test('jax.dispatch fires events', () => {
    let fired = false;
    window.addEventListener('test-event-abc', () => { fired = true; });
    jax.dispatch('test-event-abc');
    return fired;
});

// jax.on test
test('jax.on registers click listeners', () => {
    let clicked = false;
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    jax.on(btn, 'click', () => { clicked = true; });
    btn.click();
    return clicked;
});

// jax.one test
test('jax.one fires only once', () => {
    let count = 0;
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    jax.one(btn, 'click', () => { count++; });
    btn.click();
    btn.click();
    btn.click();
    return count === 1;
});

// Extras Tests
console.log('\n\x1b[36m--- Extras ---\x1b[0m');
test('jax.flashMsg is a function', () => typeof jax.flashMsg === 'function');
test('jax.progressBar exists', () => jax.progressBar !== undefined);
test('jax.attachLoader exists', () => jax.attachLoader !== undefined);

// Control System Tests
console.log('\n\x1b[36m--- Control System ---\x1b[0m');
test('jax.registerControl is a function', () => typeof jax.registerControl === 'function');
test('jax.importControl is a function', () => typeof jax.importControl === 'function');
test('jax.observeControl is a function', () => typeof jax.observeControl === 'function');
test('jax.fetchControl is a function', () => typeof jax.fetchControl === 'function');
test('jax.ControlBase exists', () => typeof jax.ControlBase === 'function');

test('Custom control registration works', () => {
    class TestControl extends jax.ControlBase {
        init() { this.initialized = true; }
    }
    jax.registerControl('test-control', TestControl);
    return true;
});

// Form Serialization Tests
console.log('\n\x1b[36m--- Form Serialization ---\x1b[0m');
test('jax.values serializes text inputs', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'username';
    input.value = 'testuser';
    form.appendChild(input);
    document.body.appendChild(form);
    const values = jax.values(form);
    return values.username === 'testuser';
});

test('jax.values serializes multiple fields', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input type="text" name="name" value="John"><input type="email" name="email" value="john@test.com">';
    document.body.appendChild(form);
    const values = jax.values(form);
    return values.name === 'John' && values.email === 'john@test.com';
});

// Turbo Tests
console.log('\n\x1b[36m--- Turbo ---\x1b[0m');
test('jax.useTurbo is a function', () => typeof jax.useTurbo === 'function');
test('jax.visit is a function', () => typeof jax.visit === 'function');

// Summary
console.log('\n\x1b[1m=== Results ===\x1b[0m');
console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
console.log(`Total: ${passed + failed}\n`);

await window.close();
process.exit(failed > 0 ? 1 : 0);
