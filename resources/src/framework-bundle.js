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
import { waitFor } from "./util/wait";
import { registerTurbo } from "./util/turbo";

registerTurbo(AjaxTurbo);

if (!window.jax) {
    window.jax = {};
}

// Request
window.jax.AjaxRequest = AjaxRequest;
window.jax.AssetManager = AssetManager;
window.jax.ajax = AjaxRequest.send;

// Core
window.jax.AjaxFramework = AjaxFramework;
window.jax.request = AjaxFramework.requestElement;
window.jax.parseJSON = AjaxFramework.parseJSON;
window.jax.values = AjaxFramework.serializeAsJSON;

// Extras
window.jax.AjaxExtras = AjaxExtras;
window.jax.flashMsg = AjaxExtras.flashMsg;
window.jax.progressBar = AjaxExtras.progressBar;
window.jax.attachLoader = AjaxExtras.attachLoader;

// Observe
window.jax.AjaxObserve = AjaxObserve;
window.jax.ControlBase = ControlBase;
window.jax.registerControl = AjaxObserve.registerControl;
window.jax.importControl = AjaxObserve.importControl;
window.jax.observeControl = AjaxObserve.observeControl;
window.jax.fetchControl = AjaxObserve.fetchControl;
window.jax.fetchControls = AjaxObserve.fetchControls;

// Turbo
window.jax.AjaxTurbo = AjaxTurbo;
window.jax.useTurbo = AjaxTurbo.isEnabled;
window.jax.visit = AjaxTurbo.visit;
window.jax.pageReady = AjaxTurbo.pageReady;

// Util
window.jax.Events = Events;
window.jax.dispatch = Events.dispatch;
window.jax.trigger = Events.trigger;
window.jax.on = Events.on;
window.jax.off = Events.off;
window.jax.one = Events.one;
window.jax.waitFor = waitFor;

// Auto-start all modules
AjaxFramework.start();
AjaxExtras.start();
AjaxObserve.start();
AjaxTurbo.start();
