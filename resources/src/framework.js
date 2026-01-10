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
import { AssetManager } from "./request/asset-manager";
import { Events } from "./util/events";
import { waitFor, domReady } from "./util/wait";

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

// Util
window.jax.Events = Events;
window.jax.dispatch = Events.dispatch;
window.jax.trigger = Events.trigger;
window.jax.on = Events.on;
window.jax.off = Events.off;
window.jax.one = Events.one;
window.jax.waitFor = waitFor;
window.jax.pageReady = domReady;

// Fallback for turbo
window.jax.visit = (url) => window.location.assign(url);

// Auto-start
AjaxFramework.start();

// Export for IIFE global assignment
export default window.jax;
