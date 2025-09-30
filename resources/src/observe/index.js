import { ControlBase } from "./control-base";
import namespace from "./namespace";
export default namespace;

if (!window.jax) {
    window.jax = {};
}

if (!window.jax.AjaxObserve) {
    // Namespace
    window.jax.AjaxObserve = namespace;

    // Control API
    window.jax.registerControl = namespace.registerControl;

    window.jax.importControl = namespace.importControl;

    window.jax.observeControl = namespace.observeControl;

    window.jax.fetchControl = namespace.fetchControl;

    window.jax.fetchControls = namespace.fetchControls;

    // Control base class
    window.jax.ControlBase = ControlBase;

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
