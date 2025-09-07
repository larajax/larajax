import { AssetManager } from "./asset-manager";
import namespace from "./namespace";
export default namespace;

if (!window.oc) {
    window.oc = {};
}

if (!window.oc.AjaxRequest) {
    // Namespace
    window.oc.AjaxRequest = namespace;

    // Asset manager
    window.oc.AssetManager = AssetManager;

    // Request without element
    window.oc.ajax = namespace.send;

    // Request on element (framework can override)
    if (!window.oc.request) {
        window.oc.request = namespace.sendElement;
    }
}
