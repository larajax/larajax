import namespace from "./namespace";
export default namespace;

if (!window.jax) {
    window.jax = {};
}

if (!window.jax.AjaxTurbo) {
    // Namespace
    window.jax.AjaxTurbo = namespace;

    // Visit helper
    window.jax.visit = namespace.visit;

    // Enabled helper
    window.jax.useTurbo = namespace.isEnabled;

    // Page ready helper
    window.jax.pageReady = namespace.pageReady;

    // Boot controller
    if (!isAMD() && !isCommonJS()) {
        namespace.start();
    }
}

function isAMD() {
    return typeof define == "function" && define.amd;
}

function isCommonJS() {
    return typeof exports == "object" && typeof module != "undefined";
}
