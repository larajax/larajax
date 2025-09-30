import namespace from "./namespace";
export default namespace;

if (!window.jax) {
    window.jax = {};
}

if (!window.jax.AjaxExtras) {
    // Namespace
    window.jax.AjaxExtras = namespace;

    // Flash messages
    window.jax.flashMsg = namespace.flashMsg;

    // Progress bar
    window.jax.progressBar = namespace.progressBar;

    // Attach loader
    window.jax.attachLoader = namespace.attachLoader;

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
