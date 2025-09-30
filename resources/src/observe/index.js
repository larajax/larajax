import { ControlBase } from "./control-base";
import namespace from "./namespace";
export default namespace;

if (!window.oc) {
    window.oc = {};
}

if (!window.oc.AjaxObserve) {
    // Namespace
    window.oc.AjaxObserve = namespace;

    // Control API
    window.oc.registerControl = namespace.registerControl;

    window.oc.importControl = namespace.importControl;

    window.oc.observeControl = namespace.observeControl;

    window.oc.fetchControl = namespace.fetchControl;

    window.oc.fetchControls = namespace.fetchControls;

    // Control base class
    window.oc.ControlBase = ControlBase;

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
