import namespace from "./namespace";
export default namespace;

if (!window.oc) {
    window.oc = {};
}

if (!window.oc.AjaxTurbo) {
    // Namespace
    window.oc.AjaxTurbo = namespace;

    // Visit helper
    window.oc.visit = namespace.visit;

    // Enabled helper
    window.oc.useTurbo = namespace.isEnabled;

    // Page ready helper
    window.oc.pageReady = namespace.pageReady;

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
