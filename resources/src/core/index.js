import { Events } from "../util/events";
import { waitFor, domReady } from "../util/wait";
import namespace from "./namespace";
export default namespace;

if (!window.oc) {
    window.oc = {};
}

if (!window.oc.AjaxFramework) {
    // Namespace
    window.oc.AjaxFramework = namespace;

    // Request on element with builder
    window.oc.request = namespace.requestElement;

    // JSON parser
    window.oc.parseJSON = namespace.parseJSON;

    // Form serializer
    window.oc.serializeJSON = namespace.serializeJSON;

    // Selector events
    window.oc.Events = Events;

    // Wait for a variable to exist
    window.oc.waitFor = waitFor;

    // Fallback for turbo
    window.oc.pageReady = domReady;

    // Fallback for turbo
    window.oc.visit = (url) => window.location.assign(url);

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
