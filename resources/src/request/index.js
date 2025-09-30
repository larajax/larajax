import { AssetManager } from "./asset-manager";
import namespace from "./namespace";
export default namespace;

if (!window.jax) {
    window.jax = {};
}

if (!window.jax.AjaxRequest) {
    // Namespace
    window.jax.AjaxRequest = namespace;

    // Asset manager
    window.jax.AssetManager = AssetManager;

    // Request without element
    window.jax.ajax = namespace.send;

    // Request on element (framework can override)
    if (!window.jax.request) {
        window.jax.request = namespace.sendElement;
    }
}
