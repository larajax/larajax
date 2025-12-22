/**
 * --------------------------------------------------------------------------
 * Larajax: Frontend JavaScript Framework
 * https://larajax.org
 * --------------------------------------------------------------------------
 * Copyright 2025 Responsiv Pty. Ltd.
 * --------------------------------------------------------------------------
 */

// Individual class exports (tree-shakeable)
export { Request as AjaxRequest } from "./request/request";
export { AssetManager } from "./request/asset-manager";
export { ProgressBar } from "./extras/progress-bar";
export { FlashMessage } from "./extras/flash-message";
export { ControlBase } from "./observe/control-base";
export { Events } from "./util/events";
export { waitFor, domReady } from "./util/wait";

// Namespace exports
export { default as AjaxFramework } from "./core/namespace";
export { default as AjaxExtras } from "./extras/namespace";
export { default as AjaxObserve } from "./observe/namespace";
export { default as AjaxTurbo } from "./turbo/namespace";

// Combined jax object for simple mode
import AjaxFramework from "./core/namespace";
import AjaxRequest from "./request/namespace";
import AjaxExtras from "./extras/namespace";
import AjaxObserve from "./observe/namespace";
import AjaxTurbo from "./turbo/namespace";
import { ControlBase } from "./observe/control-base";
import { AssetManager } from "./request/asset-manager";
import { Events } from "./util/events";
import { waitFor, domReady } from "./util/wait";

export const jax = {
    // Request
    AjaxRequest,
    AssetManager,
    ajax: AjaxRequest.send,

    // Core
    AjaxFramework,
    request: AjaxFramework.requestElement,
    parseJSON: AjaxFramework.parseJSON,
    values: AjaxFramework.serializeAsJSON,

    // Extras
    AjaxExtras,
    flashMsg: AjaxExtras.flashMsg,
    progressBar: AjaxExtras.progressBar,
    attachLoader: AjaxExtras.attachLoader,

    // Observe
    AjaxObserve,
    ControlBase,
    registerControl: AjaxObserve.registerControl,
    importControl: AjaxObserve.importControl,
    observeControl: AjaxObserve.observeControl,
    fetchControl: AjaxObserve.fetchControl,
    fetchControls: AjaxObserve.fetchControls,

    // Turbo
    AjaxTurbo,
    useTurbo: AjaxTurbo.isEnabled,
    visit: AjaxTurbo.visit,

    // Util
    Events,
    dispatch: Events.dispatch,
    trigger: Events.trigger,
    on: Events.on,
    off: Events.off,
    one: Events.one,
    waitFor,
    pageReady: domReady,

    // Start all modules
    start() {
        AjaxFramework.start();
        AjaxExtras.start();
        AjaxObserve.start();
        AjaxTurbo.start();
    }
};
