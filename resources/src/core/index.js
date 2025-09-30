import { Events } from "../util/events";
import { waitFor, domReady } from "../util/wait";
import namespace from "./namespace";
export default namespace;

if (!window.jax) {
    window.jax = {};
}

if (!window.jax.AjaxFramework) {
    // Namespace
    window.jax.AjaxFramework = namespace;

    // Request on element with builder
    window.jax.request = namespace.requestElement;

    // JSON parser
    window.jax.parseJSON = namespace.parseJSON;

    // Form serializer
    window.jax.serializeJSON = namespace.serializeJSON;

    // Selector events
    window.jax.Events = Events;

    // Wait for a variable to exist
    window.jax.waitFor = waitFor;

    // Fallback for turbo
    window.jax.pageReady = domReady;

    // Fallback for turbo
    window.jax.visit = (url) => window.location.assign(url);

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
