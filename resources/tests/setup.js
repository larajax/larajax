import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Polyfill requestAnimationFrame/cancelAnimationFrame if not provided by happy-dom
if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}
