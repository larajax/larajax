import { registerTurbo } from "./turbo";

/**
 * Builds the jax object from provided modules
 * Used by framework.js, framework-bundle.js, and index.js to reduce duplication
 */
export function buildJaxObject(modules) {
    const {
        AjaxFramework,
        AjaxRequest,
        AssetManager,
        Events,
        waitFor,
        visit,
        // Optional modules
        AjaxExtras,
        AjaxObserve,
        AjaxTurbo,
        ControlBase,
    } = modules;

    const jax = {
        // Request
        AjaxRequest,
        AssetManager,
        ajax: AjaxRequest.send,

        // Core
        AjaxFramework,
        request: AjaxFramework.requestElement,
        parseJSON: AjaxFramework.parseJSON,
        values: AjaxFramework.serializeAsJSON,
        pageReady: AjaxFramework.pageReady,

        // Util
        Events,
        dispatch: Events.dispatch,
        trigger: Events.trigger,
        on: Events.on,
        off: Events.off,
        one: Events.one,
        waitFor,
        visit,
    };

    // Extras (optional)
    if (AjaxExtras) {
        jax.AjaxExtras = AjaxExtras;
        jax.flashMsg = AjaxExtras.flashMsg;
        jax.progressBar = AjaxExtras.progressBar;
        jax.attachLoader = AjaxExtras.attachLoader;
    }

    // Observe (optional)
    if (AjaxObserve) {
        jax.AjaxObserve = AjaxObserve;
        jax.registerControl = AjaxObserve.registerControl;
        jax.importControl = AjaxObserve.importControl;
        jax.observeControl = AjaxObserve.observeControl;
        jax.fetchControl = AjaxObserve.fetchControl;
        jax.fetchControls = AjaxObserve.fetchControls;
    }

    // ControlBase (optional)
    if (ControlBase) {
        jax.ControlBase = ControlBase;
    }

    // Turbo (optional)
    if (AjaxTurbo) {
        registerTurbo(AjaxTurbo);
        jax.AjaxTurbo = AjaxTurbo;
        jax.useTurbo = AjaxTurbo.isEnabled;
    }

    return jax;
}
