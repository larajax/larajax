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
import { waitFor } from "./util/wait";
import { buildJaxObject } from "./util/jax-builder";

if (!window.jax) {
    window.jax = {};
}

Object.assign(window.jax, buildJaxObject({
    AjaxFramework,
    AjaxRequest,
    AssetManager,
    Events,
    waitFor,
    visit: (url) => window.location.assign(url),
}));

// Auto-start
AjaxFramework.start();
