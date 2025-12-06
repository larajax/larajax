/**
 * --------------------------------------------------------------------------
 * Larajax: Frontend JavaScript Framework
 * https://larajax.org
 * --------------------------------------------------------------------------
 * Copyright 2025 Responsiv Pty. Ltd.
 * --------------------------------------------------------------------------
 */

import AjaxFramework from "./core/namespace";
import AjaxRequest from "./request/namespace";
import AjaxExtras from "./extras/namespace";
import AjaxObserve from "./observe/namespace";
import AjaxTurbo from "./turbo/namespace";
import { ControlBase } from "./observe/control-base";
import { AssetManager } from "./request/asset-manager";
import { Events } from "./util/events";
import { waitFor, domReady } from "./util/wait";

export default {
    AjaxRequest,
    AssetManager,
    ajax: AjaxRequest.send,

    AjaxFramework,
    Events,
    request: AjaxFramework.requestElement,
    parseJSON: AjaxFramework.parseJSON,
    values: AjaxFramework.serializeAsJSON,
    pageReady: domReady,
    waitFor,
    dispatch: Events.dispatch,
    trigger: Events.trigger,
    on: Events.on,
    off: Events.off,
    one: Events.one,

    AjaxExtras,
    flashMsg: AjaxExtras.flashMsg,
    progressBar: AjaxExtras.progressBar,
    attachLoader: AjaxExtras.attachLoader,

    AjaxObserve,
    ControlBase,
    registerControl: AjaxObserve.registerControl,
    importControl: AjaxObserve.importControl,
    observeControl: AjaxObserve.observeControl,
    fetchControl: AjaxObserve.fetchControl,
    fetchControls: AjaxObserve.fetchControls,

    AjaxTurbo,
    useTurbo: AjaxTurbo.isEnabled,
    visit: AjaxTurbo.visit,
};
