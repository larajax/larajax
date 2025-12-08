var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function() {
  "use strict";
  class AssetManager {
    /**
     * Load a collection of assets.
     * @param {{js?: string[], css?: string[], img?: string[]}} collection
     * @param {(err?: Error) => void} [callback]  // optional; called on success or with error
     * @returns {Promise<void>}
     */
    static load(collection = {}, callback) {
      const manager = new AssetManager(), promise = manager.loadCollection(collection);
      if (typeof callback === "function") {
        promise.then(() => callback());
      }
      return promise;
    }
    async loadCollection(collection = {}) {
      const jsList = (collection.js ?? []).filter((src) => !document.querySelector(`head script[src="${htmlEscape(src)}"]`));
      const cssList = (collection.css ?? []).filter((href) => !document.querySelector(`head link[href="${htmlEscape(href)}"]`));
      const imgList = collection.img ?? [];
      if (!jsList.length && !cssList.length && !imgList.length) {
        return;
      }
      await Promise.all([
        this.loadJavaScript(jsList),
        Promise.all(cssList.map((h) => this.loadStyleSheet(h))),
        this.loadImages(imgList)
      ]);
    }
    loadStyleSheet(href) {
      return new Promise((resolve, reject) => {
        const el = document.createElement("link");
        el.rel = "stylesheet";
        el.type = "text/css";
        el.href = href;
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
        document.head.appendChild(el);
      });
    }
    // Sequential loading (safer for dependencies)
    loadJavaScript(list) {
      return list.reduce((p, src) => {
        return p.then(() => new Promise((resolve, reject) => {
          const el = document.createElement("script");
          el.type = "text/javascript";
          el.src = src;
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
          document.head.appendChild(el);
        }));
      }, Promise.resolve());
    }
    loadImages(list) {
      if (!list.length) return Promise.resolve();
      return Promise.all(list.map((src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      })));
    }
  }
  function htmlEscape(value) {
    return String(value).replace(/"/g, '\\"');
  }
  class Envelope {
    constructor(response = {}, status = 200) {
      const {
        __ajax: body,
        ...data
      } = response;
      this.ok = !!body.ok;
      this.severity = body.severity || "info";
      this.message = body.message ?? null;
      this.data = data || {};
      this.invalid = body.invalid || {};
      this.ops = Array.isArray(body.ops) ? body.ops : [];
      this.redirect = null;
      this.status = status;
    }
    isFatal() {
      return this.severity === "fatal" || this.status >= 500 && this.status <= 599;
    }
    isError() {
      return this.severity === "error" || this.isFatal() || this.ok === false;
    }
    getMessage() {
      return this.message;
    }
    getInvalid() {
      return this.invalid || {};
    }
    getData() {
      return this.data || {};
    }
    getStatus() {
      return this.status;
    }
    getSeverity() {
      return this.severity;
    }
    getOps(type) {
      if (!type) {
        return this.ops;
      }
      return this.ops.filter((o) => (o == null ? void 0 : o.op) === type);
    }
    getFlash() {
      return this.getOps("flash").map(({ level = "info", text = "" }) => ({ level, text }));
    }
    getBrowserEvents() {
      return this.getOps("dispatch").map(({ selector = null, event, detail, async }) => ({
        selector,
        event,
        detail,
        async
      }));
    }
    getDomPatches() {
      return this.getOps("patchDom").map(({ selector, html = "", swap = "innerHTML" }) => ({
        selector,
        html,
        swap
      }));
    }
    getPartials() {
      return this.getOps("partial").map(({ name, html = "" }) => ({ name, html }));
    }
    getAssets() {
      const out = { js: [], css: [], img: [] };
      for (const { type, urls = [] } of this.getOps("loadAssets")) {
        if (!out[type]) {
          continue;
        }
        out[type].push(...urls);
      }
      out.js = Array.from(new Set(out.js));
      out.css = Array.from(new Set(out.css));
      out.img = Array.from(new Set(out.img));
      return out;
    }
    getRedirectUrl() {
      const op = this.getOps("redirect")[0];
      return (op == null ? void 0 : op.url) || this.redirect || null;
    }
    getReload() {
      return this.getOps("reload")[0] || null;
    }
  }
  class Options {
    constructor(handler, options) {
      if (!handler) {
        throw new Error("The request handler name is not specified.");
      }
      if (!handler.match(/^(?:\w+\:{2})?on*/)) {
        throw new Error('Invalid handler name. The correct handler name format is: "onEvent".');
      }
      if (typeof FormData === "undefined") {
        throw new Error("The browser does not support the FormData interface.");
      }
      this.options = options;
      this.handler = handler;
    }
    static fetch(handler, options) {
      return new this(handler, options).getRequestOptions();
    }
    // Public
    getRequestOptions() {
      return {
        method: "POST",
        url: this.options.url ? this.options.url : window.location.href,
        headers: this.buildHeaders(),
        responseType: this.options.download === false ? "" : "blob"
      };
    }
    // Private
    buildHeaders() {
      const { handler, options } = this;
      const headers = {
        "X-Requested-With": "XMLHttpRequest",
        "X-AJAX-HANDLER": handler
      };
      if (!options.files) {
        headers["Content-Type"] = options.bulk ? "application/json" : "application/x-www-form-urlencoded";
      }
      if (options.flash) {
        headers["X-AJAX-FLASH"] = 1;
      }
      if (options.partial) {
        headers["X-AJAX-PARTIAL"] = options.partial;
      }
      var partials = this.extractPartials(options.update, options.partial);
      if (partials) {
        headers["X-AJAX-PARTIALS"] = partials;
      }
      var xsrfToken = this.getXSRFToken();
      if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
      }
      var csrfToken = this.getCSRFToken();
      if (csrfToken) {
        headers["X-CSRF-TOKEN"] = csrfToken;
      }
      if (options.headers && options.headers.constructor === {}.constructor) {
        Object.assign(headers, options.headers);
      }
      return headers;
    }
    extractPartials(update = {}, selfPartial) {
      var result = [];
      if (update) {
        if (typeof update !== "object") {
          throw new Error("Invalid update value. The correct format is an object ({...})");
        }
        for (var partial in update) {
          if (partial === "_self" && selfPartial) {
            result.push(selfPartial);
          } else {
            result.push(partial);
          }
        }
      }
      return result.join("&");
    }
    getCSRFToken() {
      var tag = document.querySelector('meta[name="csrf-token"]');
      return tag ? tag.getAttribute("content") : null;
    }
    getXSRFToken() {
      var cookieValue = null;
      if (document.cookie && document.cookie != "") {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i].replace(/^([\s]*)|([\s]*)$/g, "");
          if (cookie.substring(0, 11) == "XSRF-TOKEN=") {
            cookieValue = decodeURIComponent(cookie.substring(11));
            break;
          }
        }
      }
      return cookieValue;
    }
  }
  var DomUpdateMode = {
    replaceWith: "replace",
    prepend: "prepend",
    append: "append",
    update: "innerHTML"
  };
  class DomPatcher {
    constructor(envelope, partialMap, options = {}) {
      this.options = options;
      this.envelope = envelope;
      this.partialMap = partialMap;
      this.afterUpdateCallback = null;
    }
    apply() {
      this.applyPartialUpdates();
      this.applyDomUpdates();
    }
    afterUpdate(callback) {
      this.afterUpdateCallback = callback;
    }
    // Should patch the dom using the envelope.getPartials()
    // which is expected to be { partialName: html contents }
    applyPartialUpdates() {
      const partials = this.envelope.getPartials();
      partials.forEach((partial) => {
        const selector = this.partialMap[partial.name];
        let selectedEl = [];
        if (this.partialMap["_self"] && partial == this.options.partial && this.options.partialEl) {
          selector = this.partialMap["_self"];
          selectedEl = [this.options.partialEl];
        } else if (selector) {
          selectedEl = resolveSelectorResponse(selector, '[data-ajax-partial="' + partial + '"]');
        }
        selectedEl.forEach((el) => {
          this.patchDom(
            el,
            partial.html,
            getSelectorUpdateMode(selector, el)
          );
        });
      });
    }
    // Should patch the dom using the envelope.getDomPatches()
    applyDomUpdates() {
      const updates = this.envelope.getDomPatches();
      updates.forEach((update) => {
        document.querySelectorAll(update.selector).forEach((el) => {
          this.patchDom(el, update.html, update.swap);
        });
      });
    }
    patchDom(element, content, swapType) {
      const parentEl = element.parentNode;
      switch (swapType) {
        case "append":
        case "beforeend":
          element.insertAdjacentHTML("beforeend", content);
          runScriptsOnFragment(element, content);
          break;
        case "afterend":
          element.insertAdjacentHTML("afterend", content);
          runScriptsOnFragment(element, content);
          break;
        case "beforebegin":
          element.insertAdjacentHTML("beforebegin", content);
          runScriptsOnFragment(element, content);
          break;
        case "prepend":
        case "afterbegin":
          element.insertAdjacentHTML("afterbegin", content);
          runScriptsOnFragment(element, content);
          break;
        case "replace":
          element.replaceWith(content);
          runScriptsOnFragment(parentEl, content);
          break;
        case "outerHTML":
          element.outerHTML = content;
          runScriptsOnFragment(parentEl, content);
          break;
        default:
        case "innerHTML":
          element.innerHTML = content;
          runScriptsOnElement(element);
          break;
      }
      if (this.afterUpdateCallback) {
        this.afterUpdateCallback(element);
      }
    }
  }
  function resolveSelectorResponse(selector, partialSelector) {
    if (selector === true) {
      return document.querySelectorAll(partialSelector);
    }
    if (typeof selector !== "string") {
      return [selector];
    }
    if (["#", ".", "@", "^", "!", "="].indexOf(selector.charAt(0)) === -1) {
      return [];
    }
    if (["@", "^", "!", "="].indexOf(selector.charAt(0)) !== -1) {
      selector = selector.substring(1);
    }
    if (!selector) {
      selector = partialSelector;
    }
    return document.querySelectorAll(selector);
  }
  function getSelectorUpdateMode(selector, el) {
    if (typeof selector === "string") {
      if (selector.charAt(0) === "!") {
        return DomUpdateMode.replaceWith;
      }
      if (selector.charAt(0) === "@") {
        return DomUpdateMode.append;
      }
      if (selector.charAt(0) === "^") {
        return DomUpdateMode.prepend;
      }
    }
    if (el.dataset.ajaxUpdateMode !== void 0) {
      return el.dataset.ajaxUpdateMode;
    }
    return DomUpdateMode.update;
  }
  function runScriptsOnElement(el) {
    Array.from(el.querySelectorAll("script")).forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }
  function runScriptsOnFragment(container, html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    Array.from(div.querySelectorAll("script")).forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      container.appendChild(newScript);
      container.removeChild(newScript);
    });
  }
  function getReferrerUrl() {
    const url = jax.useTurbo && jax.useTurbo() ? jax.AjaxTurbo.controller.getLastVisitUrl() : getReferrerFromSameOrigin();
    if (!url || isSameBaseUrl(url)) {
      return null;
    }
    return url;
  }
  function getReferrerFromSameOrigin() {
    if (!document.referrer) {
      return null;
    }
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin !== location.origin) {
        return null;
      }
      const pushReferrer = localStorage.getItem("ocPushStateReferrer");
      if (pushReferrer && pushReferrer.indexOf(referrer.pathname) === 0) {
        return pushReferrer;
      }
      return document.referrer;
    } catch (e) {
    }
  }
  function isSameBaseUrl(url) {
    const givenUrl = new URL(url, window.location.origin), currentUrl = new URL(window.location.href);
    return givenUrl.origin === currentUrl.origin && givenUrl.pathname === currentUrl.pathname;
  }
  function decoratePromiseProxy(fn, ctx = null) {
    return (...args) => {
      const p = Promise.resolve().then(() => fn.apply(ctx, args));
      return decoratePromise(p);
    };
  }
  function decoratePromise(promise) {
    return Object.assign(promise, {
      done(fn) {
        promise.then(fn);
        return this;
      },
      fail(fn) {
        promise.catch(fn);
        return this;
      },
      always(fn) {
        promise.finally(fn);
        return this;
      }
    });
  }
  function cancellablePromise(executor) {
    if (!executor) {
      executor = () => {
      };
    }
    let hasCanceled = false;
    let cancelHandler = () => {
    };
    let resolveFn, rejectFn;
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
      executor(
        (value) => {
          if (!hasCanceled) resolve(value);
        },
        (error) => {
          if (!hasCanceled) reject(error);
        },
        (onCancel) => {
          cancelHandler = onCancel;
        }
      );
    });
    promise.cancel = () => {
      hasCanceled = true;
      cancelHandler();
    };
    promise.onCancel = (fn) => {
      cancelHandler = typeof fn === "function" ? fn : cancelHandler;
      return promise;
    };
    promise.resolve = (value) => {
      if (!hasCanceled) {
        resolveFn(value);
      }
    };
    promise.reject = (error) => {
      if (!hasCanceled) {
        rejectFn(error);
      }
    };
    return decoratePromise(promise);
  }
  class Actions {
    constructor(delegate, context, options) {
      this.el = delegate.el;
      this.delegate = delegate;
      this.context = context;
      this.options = options;
      this.context.start = this.start.bind(this);
      this.context.success = decoratePromiseProxy(this.success, this);
      this.context.error = decoratePromiseProxy(this.error, this);
      this.context.complete = decoratePromiseProxy(this.complete, this);
      this.context.cancel = this.cancel.bind(this);
    }
    // Options can override all public methods in this class
    invoke(method, args = []) {
      if (this.options[method]) {
        return this.options[method].apply(this.context, args);
      }
      if (this[method]) {
        return this[method](...args);
      }
    }
    // Options can also specify a non-interference "func" method, typically
    // used by eval-based data attributes that takes minimal arguments
    invokeFunc(method, data = null) {
      if (this.options[method]) {
        return this.options[method](this.el, this.context, data);
      }
    }
    // Public
    start(xhr) {
      this.invoke("markAsUpdating", [true]);
      if (this.delegate.options.message) {
        this.invoke("handleProgressMessage", [this.delegate.options.message, false]);
      }
    }
    async success(data, responseCode, xhr) {
      var _a;
      if (this.invoke("beforeUpdate", [data, responseCode, xhr]) === false) {
        return;
      }
      if (this.invokeFunc("beforeUpdateFunc", data) === false) {
        return;
      }
      if (!this.delegate.applicationAllowsUpdate(data, responseCode, xhr)) {
        return;
      }
      if (this.delegate.options.download && data instanceof Blob) {
        this.invoke("handleFileDownload", [data, xhr]);
        this.delegate.notifyApplicationRequestSuccess(data, responseCode, xhr);
        this.invokeFunc("successFunc", data);
        return;
      }
      if (!((_a = data.$env) == null ? void 0 : _a.isFatal())) {
        await this.invoke("handleUpdateOperations", [data, responseCode, xhr]);
        await this.invoke("handleUpdateResponse", [data, responseCode, xhr]);
      }
      this.delegate.notifyApplicationRequestSuccess(data, responseCode, xhr);
      this.invokeFunc("successFunc", data);
    }
    async error(data, responseCode, xhr) {
      var _a, _b;
      let errorMsg = (_a = data.$env) == null ? void 0 : _a.getMessage();
      if (window.jaxUnloading !== void 0 && window.jaxUnloading) {
        return;
      }
      this.delegate.toggleRedirect(false);
      if (!((_b = data.$env) == null ? void 0 : _b.isFatal())) {
        await this.invoke("handleUpdateOperations", [data, responseCode, xhr]);
        await this.invoke("handleUpdateResponse", [data, responseCode, xhr]);
      } else {
        if (data.constructor === {}.constructor) {
          if (!errorMsg && data.message) {
            errorMsg = data.message;
          } else {
            errorMsg = "Something went wrong! Check the browser console.";
            console.warn(data);
          }
        } else {
          errorMsg = data;
        }
      }
      if (this.el !== document) {
        this.el.setAttribute("data-error-message", errorMsg);
      }
      if (!this.delegate.applicationAllowsError(data, responseCode, xhr)) {
        return;
      }
      if (this.invokeFunc("errorFunc", data) === false) {
        return;
      }
      this.invoke("handleErrorMessage", [errorMsg]);
    }
    async complete(data, responseCode, xhr) {
      this.delegate.notifyApplicationRequestComplete(data, responseCode, xhr);
      this.invokeFunc("completeFunc", data);
      this.invoke("markAsUpdating", [false]);
      if (this.delegate.options.message) {
        this.invoke("handleProgressMessage", [null, true]);
      }
    }
    cancel() {
      this.invokeFunc("cancelFunc");
    }
    // Custom function, requests confirmation from the user
    handleConfirmMessage(message) {
      let resolveFn, rejectFn;
      const promise = new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });
      promise.then(() => {
        this.delegate.sendInternal();
      }).catch(() => {
        this.invoke("cancel", []);
      });
      const event = this.delegate.notifyApplicationConfirmMessage(message, {
        resolve: resolveFn,
        reject: rejectFn
      });
      if (event.defaultPrevented) {
        return false;
      }
      if (message) {
        const result = confirm(message);
        if (!result) {
          this.invoke("cancel", []);
        }
        return result;
      }
    }
    // Custom function, display a progress message to the user
    handleProgressMessage(message, isDone) {
    }
    // Custom function, display a flash message to the user
    handleFlashMessage(message, type) {
    }
    // Custom function, display an error message to the user
    handleErrorMessage(message) {
      const event = this.delegate.notifyApplicationErrorMessage(message);
      if (event.defaultPrevented) {
        return;
      }
      if (message) {
        alert(message);
      }
    }
    // Custom function, focus fields with errors
    handleValidationMessage(message, fields) {
      this.delegate.notifyApplicationBeforeValidate(message, fields);
      if (!this.delegate.formEl) {
        return;
      }
      var isFirstInvalidField = true;
      for (var fieldName in fields) {
        var fieldCheck, fieldNameOptions = [];
        fieldCheck = fieldName.replace(/\.(\w+)/g, "[$1]");
        fieldNameOptions.push('[name="' + fieldCheck + '"]:not([disabled])');
        fieldNameOptions.push('[name="' + fieldCheck + '[]"]:not([disabled])');
        fieldCheck = ("." + fieldName).replace(/\.(\w+)/g, "[$1]");
        fieldNameOptions.push('[name$="' + fieldCheck + '"]:not([disabled])');
        fieldNameOptions.push('[name$="' + fieldCheck + '[]"]:not([disabled])');
        var fieldEmpty = fieldName.replace(/\.[0-9]+$/g, "");
        if (fieldName !== fieldEmpty) {
          fieldCheck = fieldEmpty.replace(/\.(\w+)/g, "[$1]");
          fieldNameOptions.push('[name="' + fieldCheck + '[]"]:not([disabled])');
          fieldCheck = ("." + fieldEmpty).replace(/\.(\w+)/g, "[$1]");
          fieldNameOptions.push('[name$="' + fieldCheck + '[]"]:not([disabled])');
        }
        var fieldElement = this.delegate.formEl.querySelector(fieldNameOptions.join(", "));
        if (fieldElement) {
          let event = this.delegate.notifyApplicationFieldInvalid(fieldElement, fieldName, fields[fieldName], isFirstInvalidField);
          if (isFirstInvalidField) {
            if (!event.defaultPrevented) {
              fieldElement.focus();
            }
            isFirstInvalidField = false;
          }
        }
      }
    }
    // Custom function: handle browser events coming from the server
    async handleBrowserEvents(events = []) {
      if (!events.length) {
        return false;
      }
      let defaultPrevented = false;
      for (const dispatched of events) {
        const isAsync = (dispatched == null ? void 0 : dispatched.async) === true;
        if (isAsync) {
          await new Promise((outerResolve, outerReject) => {
            let settled = false;
            const resolve = (v) => {
              if (!settled) {
                settled = true;
                outerResolve(v);
              }
            };
            const reject = (e) => {
              if (!settled) {
                settled = true;
                outerReject(e);
              }
            };
            const event = this.delegate.notifyApplicationCustomEvent(dispatched.event, {
              ...dispatched.detail || {},
              context: this.context,
              promise: { resolve, reject }
            });
            if (event == null ? void 0 : event.defaultPrevented) {
              defaultPrevented = true;
            }
          });
        } else {
          const event = this.delegate.notifyApplicationCustomEvent(dispatched.event, {
            ...dispatched.detail || {},
            context: this.context
          });
          if (event == null ? void 0 : event.defaultPrevented) defaultPrevented = true;
        }
      }
      return defaultPrevented;
    }
    // Custom function, redirect the browser to another location
    handleRedirectResponse(href) {
      const event = this.delegate.notifyApplicationBeforeRedirect();
      if (event.defaultPrevented) {
        return;
      }
      if (this.options.browserRedirectBack) {
        href = getReferrerUrl() || href;
      }
      if (jax.useTurbo && jax.useTurbo()) {
        jax.visit(href);
      } else {
        location.assign(href);
      }
    }
    // Custom function, reload the browser
    handleReloadResponse() {
      location.reload();
    }
    // Mark known elements as being updated
    markAsUpdating(isUpdating) {
      var updateOptions = this.options.update || {};
      for (var partial in updateOptions) {
        let selector = updateOptions[partial];
        let selectedEl = [];
        if (updateOptions["_self"] && partial == this.options.partial && this.delegate.partialEl) {
          selector = updateOptions["_self"];
          selectedEl = [this.delegate.partialEl];
        } else {
          selectedEl = resolveSelectorResponse(selector, '[data-ajax-partial="' + partial + '"]');
        }
        selectedEl.forEach(function(el) {
          if (isUpdating) {
            el.setAttribute("data-ajax-updating", "");
          } else {
            el.removeAttribute("data-ajax-updating");
          }
        });
      }
    }
    async handleUpdateResponse(data, responseCode, xhr) {
      if (!data.$env) {
        return;
      }
      const updateOptions = this.options.update || {}, domPatcher = new DomPatcher(data.$env, updateOptions, {
        partial: this.options.partial,
        partialEl: this.delegate.partialEl
      });
      domPatcher.afterUpdate((el) => {
        this.delegate.notifyApplicationAjaxUpdate(el, data, responseCode, xhr);
      });
      domPatcher.apply();
      setTimeout(() => {
        this.delegate.notifyApplicationUpdateComplete(data, responseCode, xhr);
        this.invoke("afterUpdate", [data, responseCode, xhr]);
        this.invokeFunc("afterUpdateFunc", data);
      }, 0);
    }
    async handleUpdateOperations(data, responseCode, xhr) {
      var _a, _b, _c, _d, _e, _f, _g;
      const flashMessages = this.delegate.options.flash ? (_a = data.$env) == null ? void 0 : _a.getFlash() : null;
      if (flashMessages) {
        for (var flashMessage in flashMessages) {
          this.invoke("handleFlashMessage", [flashMessage.text, flashMessage.level]);
        }
      }
      const browserEvents = (_b = data.$env) == null ? void 0 : _b.getBrowserEvents();
      if (browserEvents && await this.invoke("handleBrowserEvents", [browserEvents])) {
        return;
      }
      const redirectUrl = (_c = data.$env) == null ? void 0 : _c.getRedirectUrl();
      if (redirectUrl) {
        this.delegate.toggleRedirect(redirectUrl);
      }
      if (this.delegate.isRedirect) {
        this.invoke("handleRedirectResponse", [this.delegate.options.redirect]);
      }
      if ((_d = data.$env) == null ? void 0 : _d.getReload()) {
        this.invoke("handleReloadResponse");
      }
      const invalidFields = (_e = data.$env) == null ? void 0 : _e.getInvalid();
      if (invalidFields) {
        this.invoke("handleValidationMessage", [(_f = data.$env) == null ? void 0 : _f.getMessage(), invalidFields]);
      }
      const loadAssets = (_g = data.$env) == null ? void 0 : _g.getAssets();
      if (loadAssets) {
        await AssetManager.load(loadAssets);
      }
    }
    // Custom function, download a file response from the server
    handleFileDownload(data, xhr) {
      if (this.options.browserTarget) {
        window.open(window.URL.createObjectURL(data), this.options.browserTarget);
        return;
      }
      const fileName = typeof this.options.download === "string" ? this.options.download : getFilenameFromHttpResponse(xhr);
      if (!fileName) {
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = window.URL.createObjectURL(data);
      anchor.download = fileName;
      anchor.target = "_blank";
      anchor.click();
      window.URL.revokeObjectURL(anchor.href);
    }
    // Custom function, adds query data to the current URL
    applyQueryToUrl(queryData) {
      const searchParams = new URLSearchParams(window.location.search);
      for (const key of Object.keys(queryData)) {
        const value = queryData[key];
        if (Array.isArray(value)) {
          searchParams.delete(key);
          searchParams.delete(`${key}[]`);
          value.forEach((val) => searchParams.append(`${key}[]`, val));
        } else if (value === null) {
          searchParams.delete(key);
          searchParams.delete(`${key}[]`);
        } else {
          searchParams.set(key, value);
        }
      }
      var newUrl = window.location.pathname, queryStr = searchParams.toString();
      if (queryStr) {
        newUrl += "?" + queryStr.replaceAll("%5B%5D=", "[]=");
      }
      if (jax.useTurbo && jax.useTurbo()) {
        jax.visit(newUrl, { action: "swap", scroll: false });
      } else {
        history.replaceState(null, "", newUrl);
        localStorage.setItem("ocPushStateReferrer", newUrl);
      }
    }
  }
  function getFilenameFromHttpResponse(xhr) {
    const contentDisposition = xhr.getResponseHeader("Content-Disposition");
    if (!contentDisposition) {
      return null;
    }
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/g;
    let match = null;
    let tmpMatch = null;
    while ((tmpMatch = filenameRegex.exec(contentDisposition)) !== null) {
      match = tmpMatch;
    }
    if (match !== null && match[1]) {
      return /filename[^;*=\n]*\*=[^']*''/.exec(match[0]) === null ? match[1].replace(/['"]/g, "") : decodeURIComponent(match[1].substring(match[1].indexOf("''") + 2));
    }
    return null;
  }
  class FormSerializer {
    // Public
    static assignToObj(obj, name, value) {
      new FormSerializer().assignObjectInternal(obj, name, value);
    }
    static serializeAsJSON(element) {
      if (typeof element === "string") {
        element = document.querySelector(element);
      }
      return new FormSerializer().parseContainer(element);
    }
    // Private
    parseContainer(element) {
      let jsonData = {};
      element.querySelectorAll("input, textarea, select").forEach((field) => {
        if (!field.name || field.disabled || ["file", "reset", "submit", "button"].indexOf(field.type) > -1) {
          return;
        }
        if (["checkbox", "radio"].indexOf(field.type) > -1 && !field.checked) {
          return;
        }
        if (field.type === "select-multiple") {
          var arr = [];
          Array.from(field.options).forEach(function(option) {
            if (option.selected) {
              arr.push({
                name: field.name,
                value: option.value
              });
            }
          });
          this.assignObjectInternal(jsonData, field.name, arr);
          return;
        }
        this.assignObjectInternal(jsonData, field.name, field.value);
      });
      return jsonData;
    }
    assignObjectInternal(obj, fieldName, fieldValue) {
      this.assignObjectNested(
        obj,
        this.nameToArray(fieldName),
        fieldValue,
        fieldName.endsWith("[]")
      );
    }
    assignObjectNested(obj, fieldArr, fieldValue, isArray) {
      var currentTarget = obj, lastIndex = fieldArr.length - 1;
      fieldArr.forEach(function(prop, index) {
        if (isArray && index === lastIndex) {
          if (!Array.isArray(currentTarget[prop])) {
            currentTarget[prop] = [];
          }
          if (Array.isArray(fieldValue)) {
            currentTarget[prop].push(...fieldValue);
          } else {
            currentTarget[prop].push(fieldValue);
          }
        } else {
          if (currentTarget[prop] === void 0 || currentTarget[prop].constructor !== {}.constructor) {
            currentTarget[prop] = {};
          }
          if (index === lastIndex) {
            currentTarget[prop] = fieldValue;
          }
          currentTarget = currentTarget[prop];
        }
      });
    }
    nameToArray(fieldName) {
      var expression = /([^\]\[]+)/g, elements = [], searchResult;
      while (searchResult = expression.exec(fieldName)) {
        elements.push(searchResult[0]);
      }
      return elements;
    }
  }
  class Data {
    constructor(userData, targetEl, formEl) {
      this.userData = userData || {};
      this.targetEl = targetEl;
      this.formEl = formEl;
    }
    // Public
    getRequestData() {
      let requestData;
      if (this.formEl) {
        requestData = new FormData(this.formEl);
      } else {
        requestData = new FormData();
      }
      this.appendSingleInputElement(requestData);
      return requestData;
    }
    getAsFormData() {
      return this.appendJsonToFormData(
        this.getRequestData(),
        this.userData
      );
    }
    getAsQueryString() {
      return this.convertFormDataToQuery(
        this.getAsFormData()
      );
    }
    getAsJsonData() {
      return JSON.stringify(
        this.convertFormDataToJson(
          this.getAsFormData()
        )
      );
    }
    // Private
    appendSingleInputElement(requestData) {
      if (this.formEl || !this.targetEl || !isElementInput$1(this.targetEl)) {
        return;
      }
      const inputName = this.targetEl.name;
      if (!inputName || this.userData[inputName] !== void 0) {
        return;
      }
      if (this.targetEl.type === "file") {
        this.targetEl.files.forEach(function(value) {
          requestData.append(inputName, value);
        });
      } else {
        requestData.append(inputName, this.targetEl.value);
      }
    }
    appendJsonToFormData(formData, useJson, parentKey) {
      var self = this;
      for (var key in useJson) {
        var fieldKey = key;
        if (parentKey) {
          fieldKey = parentKey + "[" + key + "]";
        }
        var value = useJson[key];
        if (value && value.constructor === {}.constructor) {
          this.appendJsonToFormData(formData, value, fieldKey);
        } else if (value && value.constructor === [].constructor) {
          value.forEach(function(v, i) {
            if (v.constructor === {}.constructor || v.constructor === [].constructor) {
              self.appendJsonToFormData(formData, v, fieldKey + "[" + i + "]");
            } else {
              formData.append(fieldKey + "[]", self.castJsonToFormData(v));
            }
          });
        } else {
          formData.append(fieldKey, this.castJsonToFormData(value));
        }
      }
      return formData;
    }
    convertFormDataToQuery(formData) {
      let flatData = this.formDataToArray(formData);
      return Object.keys(flatData).map(function(key) {
        if (key.endsWith("[]")) {
          return flatData[key].map(function(val) {
            return encodeURIComponent(key) + "=" + encodeURIComponent(val);
          }).join("&");
        } else {
          return encodeURIComponent(key) + "=" + encodeURIComponent(flatData[key]);
        }
      }).join("&");
    }
    convertFormDataToJson(formData) {
      let flatData = this.formDataToArray(formData);
      let jsonData = {};
      for (var key in flatData) {
        FormSerializer.assignToObj(jsonData, key, flatData[key]);
      }
      return jsonData;
    }
    formDataToArray(formData) {
      return Object.fromEntries(
        Array.from(formData.keys()).map((key) => [
          key,
          key.endsWith("[]") ? formData.getAll(key) : formData.getAll(key).pop()
        ])
      );
    }
    castJsonToFormData(val) {
      if (val === null || val === void 0) {
        return "";
      }
      if (val === true) {
        return "1";
      }
      if (val === false) {
        return "0";
      }
      return val;
    }
  }
  function isElementInput$1(el) {
    return ["input", "select", "textarea"].includes((el.tagName || "").toLowerCase());
  }
  function dispatch(eventName, { target = document, detail = {}, bubbles = true, cancelable = true } = {}) {
    const event = new CustomEvent(eventName, { detail, bubbles, cancelable });
    target.dispatchEvent(event);
    return event;
  }
  function defer(callback) {
    setTimeout(callback, 1);
  }
  function unindent(strings, ...values) {
    const lines = trimLeft(interpolate(strings, values)).split("\n");
    const match = lines[0].match(/^\s+/);
    const indent = match ? match[0].length : 0;
    return lines.map((line) => line.slice(indent)).join("\n");
  }
  function trimLeft(string) {
    return string.replace(/^\n/, "");
  }
  function interpolate(strings, values) {
    return strings.reduce((result, string, i) => {
      const value = values[i] == void 0 ? "" : values[i];
      return result + string + value;
    }, "");
  }
  function array(values) {
    return Array.prototype.slice.call(values);
  }
  function uuid() {
    return Array.apply(null, { length: 36 }).map((_, i) => {
      if (i == 8 || i == 13 || i == 18 || i == 23) {
        return "-";
      } else if (i == 14) {
        return "4";
      } else if (i == 19) {
        return (Math.floor(Math.random() * 4) + 8).toString(16);
      } else {
        return Math.floor(Math.random() * 15).toString(16);
      }
    }).join("");
  }
  const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
  const stripNameRegex = /\..*/;
  const stripUidRegex = /::\d+$/;
  const eventRegistry = {};
  let uidEvent = 1;
  const customEvents = {
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  };
  const nativeEvents = /* @__PURE__ */ new Set([
    "click",
    "dblclick",
    "mouseup",
    "mousedown",
    "contextmenu",
    "mousewheel",
    "DOMMouseScroll",
    "mouseover",
    "mouseout",
    "mousemove",
    "selectstart",
    "selectend",
    "keydown",
    "keypress",
    "keyup",
    "orientationchange",
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointerleave",
    "pointercancel",
    "gesturestart",
    "gesturechange",
    "gestureend",
    "focus",
    "blur",
    "change",
    "reset",
    "select",
    "submit",
    "focusin",
    "focusout",
    "load",
    "unload",
    "beforeunload",
    "resize",
    "move",
    "DOMContentLoaded",
    "readystatechange",
    "error",
    "abort",
    "scroll"
  ]);
  class Events {
    static on(element, event, handler, delegationFunction, options) {
      addHandler(element, event, handler, delegationFunction, options, false);
    }
    static one(element, event, handler, delegationFunction, options) {
      addHandler(element, event, handler, delegationFunction, options, true);
    }
    static off(element, originalTypeEvent, handler, delegationFunction, options) {
      if (typeof originalTypeEvent !== "string" || !element) {
        return;
      }
      const [isDelegated, callable, typeEvent, opts] = normalizeParameters(originalTypeEvent, handler, delegationFunction, options);
      const inNamespace = typeEvent !== originalTypeEvent;
      const events = getElementEvents(element);
      const storeElementEvent = events[typeEvent] || {};
      const isNamespace = originalTypeEvent.startsWith(".");
      if (typeof callable !== "undefined") {
        if (!storeElementEvent) {
          return;
        }
        removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null, opts);
        return;
      }
      if (isNamespace) {
        for (const elementEvent of Object.keys(events)) {
          removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
        }
      }
      for (const keyHandlers of Object.keys(storeElementEvent)) {
        const handlerKey = keyHandlers.replace(stripUidRegex, "");
        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          const event = storeElementEvent[keyHandlers];
          removeHandler(element, events, typeEvent, event.callable, event.delegationSelector, opts);
        }
      }
    }
    static dispatch(eventName, { target = document, detail = {}, bubbles = true, cancelable = true } = {}) {
      return dispatch(eventName, { target, detail, bubbles, cancelable });
    }
    static trigger(target, eventName, { detail = {}, bubbles = true, cancelable = true } = {}) {
      return dispatch(eventName, { target, detail, bubbles, cancelable });
    }
  }
  function makeEventUid(element, uid) {
    return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
  }
  function getElementEvents(element) {
    const uid = makeEventUid(element);
    element.uidEvent = uid;
    eventRegistry[uid] = eventRegistry[uid] || {};
    return eventRegistry[uid];
  }
  function findHandler(events, callable, delegationSelector = null) {
    return Object.values(events).find((event) => event.callable === callable && event.delegationSelector === delegationSelector);
  }
  function normalizeParameters(originalTypeEvent, handler, delegationFunction, options) {
    const isDelegated = typeof handler === "string";
    const callable = isDelegated ? delegationFunction : handler;
    const opts = isDelegated ? options : delegationFunction;
    let typeEvent = getTypeEvent(originalTypeEvent);
    if (!nativeEvents.has(typeEvent)) {
      typeEvent = originalTypeEvent;
    }
    return [isDelegated, callable, typeEvent, opts];
  }
  function addHandler(element, originalTypeEvent, handler, delegationFunction, options, oneOff) {
    if (typeof originalTypeEvent !== "string" || !element) {
      return;
    }
    let [isDelegated, callable, typeEvent, opts] = normalizeParameters(originalTypeEvent, handler, delegationFunction, options);
    if (originalTypeEvent in customEvents) {
      const wrapFunction = (fn2) => {
        return function(event) {
          if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
            return fn2.call(this, event);
          }
        };
      };
      callable = wrapFunction(callable);
    }
    const events = getElementEvents(element);
    const handlers = events[typeEvent] || (events[typeEvent] = {});
    const previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);
    if (previousFunction) {
      previousFunction.oneOff = previousFunction.oneOff && oneOff;
      return;
    }
    const uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ""));
    const fn = isDelegated ? internalDelegationHandler(element, handler, callable) : internalHandler(element, callable);
    fn.delegationSelector = isDelegated ? handler : null;
    fn.callable = callable;
    fn.oneOff = oneOff;
    fn.uidEvent = uid;
    handlers[uid] = fn;
    element.addEventListener(typeEvent, fn, opts);
  }
  function removeHandler(element, events, typeEvent, handler, delegationSelector, options) {
    const fn = findHandler(events[typeEvent], handler, delegationSelector);
    if (!fn) {
      return;
    }
    element.removeEventListener(typeEvent, fn, options);
    delete events[typeEvent][fn.uidEvent];
  }
  function internalHandler(element, fn) {
    return function handler(event) {
      event.delegateTarget = element;
      if (handler.oneOff) {
        Events.off(element, event.type, fn);
      }
      return fn.apply(element, [event]);
    };
  }
  function internalDelegationHandler(element, selector, fn) {
    return function handler(event) {
      const domElements = element.querySelectorAll(selector);
      for (let { target } = event; target && target !== this; target = target.parentNode) {
        for (const domElement of domElements) {
          if (domElement !== target) {
            continue;
          }
          event.delegateTarget = target;
          if (handler.oneOff) {
            Events.off(element, event.type, selector, fn);
          }
          return fn.apply(target, [event]);
        }
      }
    };
  }
  function removeNamespacedHandlers(element, events, typeEvent, namespace2) {
    const storeElementEvent = events[typeEvent] || {};
    for (const handlerKey of Object.keys(storeElementEvent)) {
      if (handlerKey.includes(namespace2)) {
        const event = storeElementEvent[handlerKey];
        removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
      }
    }
  }
  function getTypeEvent(event) {
    event = event.replace(stripNameRegex, "");
    return customEvents[event] || event;
  }
  var SystemStatusCode = {
    networkFailure: 0,
    timeoutFailure: -1,
    contentTypeMismatch: -2,
    userAborted: -3
  };
  class HttpRequest {
    constructor(delegate, url, options) {
      this.failed = false;
      this.progress = 0;
      this.sent = false;
      this.delegate = delegate;
      this.url = url;
      this.options = options;
      this.headers = options.headers || {};
      this.method = options.method || "GET";
      this.responseType = options.responseType || "";
      this.data = options.data;
      this.timeout = options.timeout || 0;
      this.requestProgressed = (event) => {
        if (event.lengthComputable) {
          this.setProgress(event.loaded / event.total);
        }
      };
      this.requestLoaded = () => {
        this.endRequest((xhr) => {
          this.processResponseData(xhr, (xhr2, data) => {
            const contentType = xhr2.getResponseHeader("Content-Type");
            const responseData = contentTypeIsJSON(contentType) ? JSON.parse(data) : data;
            if (this.options.htmlOnly && !contentTypeIsHTML(contentType)) {
              this.failed = true;
              this.delegate.requestFailedWithStatusCode(SystemStatusCode.contentTypeMismatch);
              return;
            }
            if (xhr2.status >= 200 && xhr2.status < 300) {
              this.delegate.requestCompletedWithResponse(responseData, xhr2.status, contentResponseIsRedirect(xhr2, this.url));
            } else {
              this.failed = true;
              this.delegate.requestFailedWithStatusCode(xhr2.status, responseData);
            }
          });
        });
      };
      this.requestFailed = () => {
        this.endRequest(() => {
          this.failed = true;
          this.delegate.requestFailedWithStatusCode(SystemStatusCode.networkFailure);
        });
      };
      this.requestTimedOut = () => {
        this.endRequest(() => {
          this.failed = true;
          this.delegate.requestFailedWithStatusCode(SystemStatusCode.timeoutFailure);
        });
      };
      this.requestCanceled = () => {
        if (this.options.trackAbort) {
          this.endRequest(() => {
            this.failed = true;
            this.delegate.requestFailedWithStatusCode(SystemStatusCode.userAborted);
          });
        } else {
          this.endRequest();
        }
      };
      this.createXHR();
    }
    send() {
      if (this.xhr && !this.sent) {
        this.notifyApplicationBeforeRequestStart();
        this.setProgress(0);
        this.xhr.send(this.data || null);
        this.sent = true;
        this.delegate.requestStarted();
      }
    }
    abort() {
      if (this.xhr && this.sent) {
        this.xhr.abort();
      }
    }
    // Application events
    notifyApplicationBeforeRequestStart() {
      Events.dispatch("ajax:request-start", { detail: { url: this.url, xhr: this.xhr }, cancelable: false });
    }
    notifyApplicationAfterRequestEnd() {
      Events.dispatch("ajax:request-end", { detail: { url: this.url, xhr: this.xhr }, cancelable: false });
    }
    // Private
    createXHR() {
      const xhr = this.xhr = new XMLHttpRequest();
      xhr.open(this.method, this.url, true);
      xhr.responseType = this.responseType;
      xhr.onprogress = this.requestProgressed;
      xhr.onload = this.requestLoaded;
      xhr.onerror = this.requestFailed;
      xhr.ontimeout = this.requestTimedOut;
      xhr.onabort = this.requestCanceled;
      if (this.timeout) {
        xhr.timeout = this.timeout * 1e3;
      }
      for (var i in this.headers) {
        xhr.setRequestHeader(i, this.headers[i]);
      }
      return xhr;
    }
    endRequest(callback = () => {
    }) {
      if (this.xhr) {
        this.notifyApplicationAfterRequestEnd();
        callback(this.xhr);
        this.destroy();
      }
    }
    setProgress(progress) {
      this.progress = progress;
      this.delegate.requestProgressed(progress);
    }
    destroy() {
      this.setProgress(1);
      this.delegate.requestFinished();
    }
    processResponseData(xhr, callback) {
      if (this.responseType !== "blob") {
        callback(xhr, xhr.responseText);
        return;
      }
      const contentDisposition = xhr.getResponseHeader("Content-Disposition") || "";
      if (contentDisposition.indexOf("attachment") === 0 || contentDisposition.indexOf("inline") === 0) {
        callback(xhr, xhr.response);
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        callback(xhr, reader.result);
      });
      reader.readAsText(xhr.response);
    }
  }
  function contentResponseIsRedirect(xhr, url) {
    if (xhr.getResponseHeader("X-AJAX-LOCATION")) {
      return xhr.getResponseHeader("X-AJAX-LOCATION");
    }
    var anchorMatch = url.match(/^(.*)#/), wantUrl = anchorMatch ? anchorMatch[1] : url;
    return wantUrl !== xhr.responseURL ? xhr.responseURL : null;
  }
  function contentTypeIsHTML(contentType) {
    return (contentType || "").match(/^text\/html|^application\/xhtml\+xml/);
  }
  function contentTypeIsJSON(contentType) {
    return (contentType || "").includes("application/json");
  }
  const _ProgressBar = class _ProgressBar {
    constructor() {
      this.stylesheetElement = this.createStylesheetElement();
      this.progressElement = this.createProgressElement();
      this.hiding = false;
      this.value = 0;
      this.visible = false;
      this.trickle = () => {
        this.setValue(this.value + Math.random() / 100);
      };
    }
    static get defaultCSS() {
      return unindent`
        .oc-progress-bar {
            position: fixed;
            display: block;
            top: 0;
            left: 0;
            height: 3px;
            background: #0076ff;
            z-index: 9999;
            transition:
                width ${_ProgressBar.animationDuration}ms ease-out,
                opacity ${_ProgressBar.animationDuration / 2}ms ${_ProgressBar.animationDuration / 2}ms ease-in;
            transform: translate3d(0, 0, 0);
        }
    `;
    }
    static get progressBar() {
      return {
        show: function() {
          const instance = getOrCreateInstance$1();
          instance.setValue(0);
          instance.show();
        },
        hide: function() {
          const instance = getOrCreateInstance$1();
          instance.setValue(100);
          instance.hide();
        }
      };
    }
    show(options = {}) {
      if (options.cssClass) {
        this.progressElement.classList.add(options.cssClass);
      }
      if (!this.visible) {
        this.visible = true;
        this.installStylesheetElement();
        this.installProgressElement();
        this.startTrickling();
      }
    }
    hide() {
      if (this.visible && !this.hiding) {
        this.hiding = true;
        this.fadeProgressElement(() => {
          this.uninstallProgressElement();
          this.stopTrickling();
          this.visible = false;
          this.hiding = false;
        });
      }
    }
    setValue(value) {
      this.value = value;
      this.refresh();
    }
    // Private
    installStylesheetElement() {
      if (!_ProgressBar.stylesheetReady) {
        document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
        _ProgressBar.stylesheetReady = true;
      }
    }
    installProgressElement() {
      this.progressElement.style.width = "0";
      this.progressElement.style.opacity = "1";
      document.documentElement.insertBefore(this.progressElement, document.body);
      this.refresh();
    }
    fadeProgressElement(callback) {
      this.progressElement.style.opacity = "0";
      setTimeout(callback, _ProgressBar.animationDuration * 1.5);
    }
    uninstallProgressElement() {
      if (this.progressElement.parentNode) {
        document.documentElement.removeChild(this.progressElement);
      }
    }
    startTrickling() {
      if (!this.trickleInterval) {
        this.trickleInterval = setInterval(this.trickle, _ProgressBar.animationDuration);
      }
    }
    stopTrickling() {
      clearInterval(this.trickleInterval);
      delete this.trickleInterval;
    }
    refresh() {
      requestAnimationFrame(() => {
        this.progressElement.style.width = `${10 + this.value * 90}%`;
      });
    }
    createStylesheetElement() {
      const element = document.createElement("style");
      element.textContent = _ProgressBar.defaultCSS;
      return element;
    }
    createProgressElement() {
      const element = document.createElement("div");
      element.className = "oc-progress-bar";
      return element;
    }
  };
  __publicField(_ProgressBar, "instance", null);
  __publicField(_ProgressBar, "stylesheetReady", false);
  __publicField(_ProgressBar, "animationDuration", 300);
  let ProgressBar = _ProgressBar;
  function getOrCreateInstance$1() {
    if (!ProgressBar.instance) {
      ProgressBar.instance = new ProgressBar();
    }
    return ProgressBar.instance;
  }
  class Request {
    constructor(element, handler, options) {
      this.el = element;
      this.handler = handler;
      this.options = { ...this.constructor.DEFAULTS, ...options || {} };
      this.context = { el: element, handler, options: this.options };
      this.progressBar = new ProgressBar();
      this.showProgressBar = () => {
        this.progressBar.show({ cssClass: "is-ajax" });
      };
    }
    static get DEFAULTS() {
      return {
        handler: null,
        update: {},
        files: false,
        bulk: false,
        download: false,
        browserTarget: null,
        browserValidate: false,
        browserRedirectBack: false,
        progressBarDelay: 500,
        progressBar: null
      };
    }
    start() {
      if (!this.applicationAllowsSetup()) {
        return;
      }
      this.initOtherElements();
      this.preprocessOptions();
      this.actions = new Actions(this, this.context, this.options);
      if (this.actions.invokeFunc("beforeSendFunc") === false) {
        return;
      }
      if (!this.validateClientSideForm() || !this.applicationAllowsRequest()) {
        return;
      }
      if (this.options.confirm && !this.actions.invoke("handleConfirmMessage", [this.options.confirm])) {
        return;
      }
      this.sendInternal();
      return this.promise;
    }
    sendInternal() {
      const dataObj = new Data(this.options.data, this.el, this.formEl);
      let data;
      if (this.options.files) {
        data = dataObj.getAsFormData();
      } else if (this.options.bulk) {
        data = dataObj.getAsJsonData();
      } else {
        data = dataObj.getAsQueryString();
      }
      if (this.options.query) {
        this.actions.invoke("applyQueryToUrl", [
          this.options.query !== true ? this.options.query : JSON.parse(dataObj.getAsJsonData())
        ]);
      }
      const { url, headers, method, responseType } = Options.fetch(this.handler, this.options);
      this.request = new HttpRequest(this, url, { method, headers, responseType, data, trackAbort: true });
      this.promise = cancellablePromise();
      this.isRedirect = this.options.redirect && this.options.redirect.length > 0;
      this.notifyApplicationBeforeSend();
      this.notifyApplicationAjaxPromise();
      this.promise.onCancel(() => {
        this.request.abort();
      }).then((data2) => {
        if (!this.isRedirect) {
          this.notifyApplicationAjaxDone(data2, data2.$status, data2.$xhr);
          this.notifyApplicationAjaxAlways(data2, data2.$status, data2.$xhr);
          this.notifyApplicationSendComplete(data2, data2.$status, data2.$xhr);
        }
      }).catch((data2) => {
        if (!this.isRedirect) {
          this.notifyApplicationAjaxFail(data2, data2.$status, data2.$xhr);
          this.notifyApplicationAjaxAlways(data2, data2.$status, data2.$xhr);
          this.notifyApplicationSendComplete(data2, data2.$status, data2.$xhr);
        }
      });
      this.request.send();
    }
    static send(handler, options) {
      return new Request(document, handler, options).start();
    }
    static sendElement(element, handler, options) {
      if (typeof element === "string") {
        element = document.querySelector(element);
      }
      return new Request(element, handler, options).start();
    }
    toggleRedirect(redirectUrl) {
      if (!redirectUrl) {
        this.options.redirect = null;
        this.isRedirect = false;
      } else {
        this.options.redirect = redirectUrl;
        this.isRedirect = true;
      }
    }
    applicationAllowsSetup() {
      const event = this.notifyApplicationAjaxSetup();
      return !event.defaultPrevented;
    }
    applicationAllowsRequest() {
      const event = this.notifyApplicationBeforeRequest();
      return !event.defaultPrevented;
    }
    applicationAllowsUpdate(data, responseCode, xhr) {
      const event = this.notifyApplicationBeforeUpdate(data, responseCode, xhr);
      return !event.defaultPrevented;
    }
    applicationAllowsError(message, responseCode, xhr) {
      const event = this.notifyApplicationRequestError(message, responseCode, xhr);
      return !event.defaultPrevented;
    }
    // Application events
    notifyApplicationAjaxSetup() {
      return dispatch("ajax:setup", { target: this.el, detail: { context: this.context } });
    }
    notifyApplicationAjaxPromise() {
      return dispatch("ajax:promise", { target: this.el, detail: { context: this.context } });
    }
    notifyApplicationAjaxFail(data, responseCode, xhr) {
      return dispatch("ajax:fail", { target: this.el, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationAjaxDone(data, responseCode, xhr) {
      return dispatch("ajax:done", { target: this.el, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationAjaxAlways(data, responseCode, xhr) {
      return dispatch("ajax:always", { target: this.el, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationAjaxUpdate(target, data, responseCode, xhr) {
      return dispatch("ajax:update", { target, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationBeforeRedirect() {
      return dispatch("ajax:before-redirect", { target: this.el });
    }
    // Container-based events
    notifyApplicationBeforeRequest() {
      return dispatch("ajax:before-request", { target: this.triggerEl, detail: { context: this.context } });
    }
    notifyApplicationBeforeUpdate(data, responseCode, xhr) {
      return dispatch("ajax:before-update", { target: this.triggerEl, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationRequestSuccess(data, responseCode, xhr) {
      return dispatch("ajax:request-success", { target: this.triggerEl, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationRequestError(message, responseCode, xhr) {
      return dispatch("ajax:request-error", { target: this.triggerEl, detail: { context: this.context, message, responseCode, xhr } });
    }
    notifyApplicationRequestComplete(data, responseCode, xhr) {
      return dispatch("ajax:request-complete", { target: this.triggerEl, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationBeforeValidate(message, fields) {
      return dispatch("ajax:before-validate", { target: this.triggerEl, detail: { context: this.context, message, fields } });
    }
    notifyApplicationBeforeReplace(target) {
      return dispatch("ajax:before-replace", { target });
    }
    // Window-based events
    notifyApplicationBeforeSend() {
      return dispatch("ajax:before-send", { target: window, detail: { context: this.context } });
    }
    notifyApplicationUpdateComplete(data, responseCode, xhr) {
      return dispatch("ajax:update-complete", { target: window, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationSendComplete(data, responseCode, xhr) {
      return dispatch("ajax:send-complete", { target: window, detail: { context: this.context, data, responseCode, xhr } });
    }
    notifyApplicationFieldInvalid(element, fieldName, errorMsg, isFirst) {
      return dispatch("ajax:invalid-field", { target: window, detail: { element, fieldName, errorMsg, isFirst } });
    }
    notifyApplicationConfirmMessage(message, promise) {
      return dispatch("ajax:confirm-message", { target: window, detail: { message, promise } });
    }
    notifyApplicationErrorMessage(message) {
      return dispatch("ajax:error-message", { target: window, detail: { message } });
    }
    notifyApplicationCustomEvent(name, data) {
      return dispatch(name, { target: this.el, detail: data });
    }
    // HTTP request delegate
    requestStarted() {
      this.markAsProgress(true);
      this.toggleLoadingElement(true);
      if (this.options.progressBar) {
        this.showProgressBarAfterDelay();
      }
      this.actions.invoke("start", [this.request.xhr]);
    }
    requestProgressed(progress) {
    }
    async requestCompletedWithResponse(response, statusCode) {
      const data = decorateResponse(response, statusCode, this.request.xhr);
      await this.actions.invoke("success", [data, statusCode, this.request.xhr]);
      await this.actions.invoke("complete", [data, statusCode, this.request.xhr]);
      this.promise.resolve(data);
    }
    async requestFailedWithStatusCode(statusCode, response) {
      const data = decorateResponse(response, statusCode, this.request.xhr);
      if (statusCode == SystemStatusCode.userAborted) {
        await this.actions.invoke("cancel", []);
      } else {
        await this.actions.invoke("error", [data, statusCode, this.request.xhr]);
      }
      await this.actions.invoke("complete", [data, statusCode, this.request.xhr]);
      this.promise.reject(data);
    }
    requestFinished() {
      this.markAsProgress(false);
      this.toggleLoadingElement(false);
      if (this.options.progressBar) {
        this.hideProgressBar();
      }
    }
    // Private
    initOtherElements() {
      if (typeof this.options.form === "string") {
        this.formEl = document.querySelector(this.options.form);
      } else if (this.options.form) {
        this.formEl = this.options.form;
      } else {
        this.formEl = this.el && this.el !== document ? this.el.closest("form") : null;
      }
      this.triggerEl = this.formEl || this.el !== document && this.el.closest("[data-request-scope]") || document.body;
      this.partialEl = this.el && this.el !== document ? this.el.closest("[data-ajax-partial]") : null;
      this.loadingEl = typeof this.options.loading === "string" ? document.querySelector(this.options.loading) : this.options.loading;
    }
    preprocessOptions() {
      if (this.options.partial === void 0 && this.partialEl && this.partialEl.dataset.ajaxPartial !== void 0) {
        this.options.partial = this.partialEl.dataset.ajaxPartial || true;
      }
    }
    validateClientSideForm() {
      if (this.options.browserValidate && typeof document.createElement("input").reportValidity === "function" && this.formEl && !this.formEl.checkValidity()) {
        this.formEl.reportValidity();
        return false;
      }
      return true;
    }
    toggleLoadingElement(isLoading) {
      if (!this.loadingEl) {
        return;
      }
      if (typeof this.loadingEl.show !== "function" || typeof this.loadingEl.hide !== "function") {
        this.loadingEl.style.display = isLoading ? "block" : "none";
        return;
      }
      if (isLoading) {
        this.loadingEl.show();
      } else {
        this.loadingEl.hide();
      }
    }
    showProgressBarAfterDelay() {
      this.progressBar.setValue(0);
      this.progressBarTimeout = window.setTimeout(this.showProgressBar, this.options.progressBarDelay);
    }
    hideProgressBar() {
      this.progressBar.setValue(100);
      this.progressBar.hide();
      if (this.progressBarTimeout != null) {
        window.clearTimeout(this.progressBarTimeout);
        delete this.progressBarTimeout;
      }
    }
    markAsProgress(isLoading) {
      if (isLoading) {
        document.documentElement.setAttribute("data-ajax-progress", "");
        if (this.formEl) {
          this.formEl.setAttribute("data-ajax-progress", this.handler);
        }
      } else {
        document.documentElement.removeAttribute("data-ajax-progress");
        if (this.formEl) {
          this.formEl.removeAttribute("data-ajax-progress");
        }
      }
    }
  }
  function decorateResponse(response, statusCode, xhr) {
    if (!response || response.constructor !== {}.constructor || !response.__ajax) {
      return response;
    }
    const { __ajax, ...data } = response, envelope = new Envelope(response, statusCode), meta = {
      env: envelope,
      status: statusCode,
      xhr
    };
    for (const [key, value] of Object.entries(meta)) {
      Object.defineProperty(data, `$${key}`, {
        value,
        enumerable: false,
        writable: false,
        configurable: true
      });
    }
    return data;
  }
  if (!window.jax) {
    window.jax = {};
  }
  if (!window.jax.AjaxRequest) {
    window.jax.AjaxRequest = Request;
    window.jax.AssetManager = AssetManager;
    window.jax.ajax = Request.send;
    if (!window.jax.request) {
      window.jax.request = Request.sendElement;
    }
  }
  function waitFor(predicate, timeout) {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (!predicate()) {
          return;
        }
        clearInterval(interval);
        resolve();
      };
      const interval = setInterval(check, 100);
      check();
      if (!timeout) {
        return;
      }
      setTimeout(() => {
        clearInterval(interval);
        reject();
      }, timeout);
    });
  }
  function domReady() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve());
      } else {
        resolve();
      }
    });
  }
  class JsonParser {
    // Public
    static paramToObj(name, value) {
      if (value === void 0) {
        value = "";
      }
      if (typeof value === "object") {
        return value;
      }
      if (value.charAt(0) !== "{") {
        value = "{" + value + "}";
      }
      try {
        return this.parseJSON(value);
      } catch (e) {
        throw new Error("Error parsing the " + name + " attribute value. " + e);
      }
    }
    static parseJSON(json) {
      return JSON.parse(new JsonParser().parseString(json));
    }
    // Private
    parseString(str) {
      str = str.trim();
      if (!str.length) {
        throw new Error("Broken JSON object.");
      }
      var result = "";
      while (str && str[0] === ",") {
        str = str.substr(1);
      }
      if (str[0] === '"' || str[0] === "'") {
        if (str[str.length - 1] !== str[0]) {
          throw new Error("Invalid string JSON object.");
        }
        var body = '"';
        for (var i = 1; i < str.length; i++) {
          if (str[i] === "\\") {
            if (str[i + 1] === "'") {
              body += str[i + 1];
            } else {
              body += str[i];
              body += str[i + 1];
            }
            i++;
          } else if (str[i] === str[0]) {
            body += '"';
            return body;
          } else if (str[i] === '"') {
            body += '\\"';
          } else body += str[i];
        }
        throw new Error("Invalid string JSON object.");
      }
      if (str === "true" || str === "false") {
        return str;
      }
      if (str === "null") {
        return "null";
      }
      var num = parseFloat(str);
      if (!isNaN(num)) {
        return num.toString();
      }
      if (str[0] === "{") {
        var type = "needKey";
        var result = "{";
        for (var i = 1; i < str.length; i++) {
          if (this.isBlankChar(str[i])) {
            continue;
          } else if (type === "needKey" && (str[i] === '"' || str[i] === "'")) {
            var key = this.parseKey(str, i + 1, str[i]);
            result += '"' + key + '"';
            i += key.length;
            i += 1;
            type = "afterKey";
          } else if (type === "needKey" && this.canBeKeyHead(str[i])) {
            var key = this.parseKey(str, i);
            result += '"';
            result += key;
            result += '"';
            i += key.length - 1;
            type = "afterKey";
          } else if (type === "afterKey" && str[i] === ":") {
            result += ":";
            type = ":";
          } else if (type === ":") {
            var body = this.getBody(str, i);
            i = i + body.originLength - 1;
            result += this.parseString(body.body);
            type = "afterBody";
          } else if (type === "afterBody" || type === "needKey") {
            var last = i;
            while (str[last] === "," || this.isBlankChar(str[last])) {
              last++;
            }
            if (str[last] === "}" && last === str.length - 1) {
              while (result[result.length - 1] === ",") {
                result = result.substr(0, result.length - 1);
              }
              result += "}";
              return result;
            } else if (last !== i && result !== "{") {
              result += ",";
              type = "needKey";
              i = last - 1;
            }
          }
        }
        throw new Error("Broken JSON object near " + result);
      }
      if (str[0] === "[") {
        var result = "[";
        var type = "needBody";
        for (var i = 1; i < str.length; i++) {
          if (" " === str[i] || "\n" === str[i] || "	" === str[i]) {
            continue;
          } else if (type === "needBody") {
            if (str[i] === ",") {
              result += "null,";
              continue;
            }
            if (str[i] === "]" && i === str.length - 1) {
              if (result[result.length - 1] === ",") result = result.substr(0, result.length - 1);
              result += "]";
              return result;
            }
            var body = this.getBody(str, i);
            i = i + body.originLength - 1;
            result += this.parseString(body.body);
            type = "afterBody";
          } else if (type === "afterBody") {
            if (str[i] === ",") {
              result += ",";
              type = "needBody";
              while (str[i + 1] === "," || this.isBlankChar(str[i + 1])) {
                if (str[i + 1] === ",") result += "null,";
                i++;
              }
            } else if (str[i] === "]" && i === str.length - 1) {
              result += "]";
              return result;
            }
          }
        }
        throw new Error("Broken JSON array near " + result);
      }
    }
    parseKey(str, pos, quote) {
      var key = "";
      for (var i = pos; i < str.length; i++) {
        if (quote && quote === str[i]) {
          return key;
        } else if (!quote && (str[i] === " " || str[i] === ":")) {
          return key;
        }
        key += str[i];
        if (str[i] === "\\" && i + 1 < str.length) {
          key += str[i + 1];
          i++;
        }
      }
      throw new Error("Broken JSON syntax near " + key);
    }
    getBody(str, pos) {
      if (str[pos] === '"' || str[pos] === "'") {
        var body = str[pos];
        for (var i = pos + 1; i < str.length; i++) {
          if (str[i] === "\\") {
            body += str[i];
            if (i + 1 < str.length) body += str[i + 1];
            i++;
          } else if (str[i] === str[pos]) {
            body += str[pos];
            return {
              originLength: body.length,
              body
            };
          } else body += str[i];
        }
        throw new Error("Broken JSON string body near " + body);
      }
      if (str[pos] === "t") {
        if (str.indexOf("true", pos) === pos) {
          return {
            originLength: "true".length,
            body: "true"
          };
        }
        throw new Error("Broken JSON boolean body near " + str.substr(0, pos + 10));
      }
      if (str[pos] === "f") {
        if (str.indexOf("f", pos) === pos) {
          return {
            originLength: "false".length,
            body: "false"
          };
        }
        throw new Error("Broken JSON boolean body near " + str.substr(0, pos + 10));
      }
      if (str[pos] === "n") {
        if (str.indexOf("null", pos) === pos) {
          return {
            originLength: "null".length,
            body: "null"
          };
        }
        throw new Error("Broken JSON boolean body near " + str.substr(0, pos + 10));
      }
      if (str[pos] === "-" || str[pos] === "+" || str[pos] === "." || str[pos] >= "0" && str[pos] <= "9") {
        var body = "";
        for (var i = pos; i < str.length; i++) {
          if (str[i] === "-" || str[i] === "+" || str[i] === "." || str[i] >= "0" && str[i] <= "9") {
            body += str[i];
          } else {
            return {
              originLength: body.length,
              body
            };
          }
        }
        throw new Error("Broken JSON number body near " + body);
      }
      if (str[pos] === "{" || str[pos] === "[") {
        var stack = [str[pos]];
        var body = str[pos];
        for (var i = pos + 1; i < str.length; i++) {
          body += str[i];
          if (str[i] === "\\") {
            if (i + 1 < str.length) body += str[i + 1];
            i++;
          } else if (str[i] === '"') {
            if (stack[stack.length - 1] === '"') {
              stack.pop();
            } else if (stack[stack.length - 1] !== "'") {
              stack.push(str[i]);
            }
          } else if (str[i] === "'") {
            if (stack[stack.length - 1] === "'") {
              stack.pop();
            } else if (stack[stack.length - 1] !== '"') {
              stack.push(str[i]);
            }
          } else if (stack[stack.length - 1] !== '"' && stack[stack.length - 1] !== "'") {
            if (str[i] === "{") {
              stack.push("{");
            } else if (str[i] === "}") {
              if (stack[stack.length - 1] === "{") {
                stack.pop();
              } else {
                throw new Error("Broken JSON " + (str[pos] === "{" ? "object" : "array") + " body near " + body);
              }
            } else if (str[i] === "[") {
              stack.push("[");
            } else if (str[i] === "]") {
              if (stack[stack.length - 1] === "[") {
                stack.pop();
              } else {
                throw new Error("Broken JSON " + (str[pos] === "{" ? "object" : "array") + " body near " + body);
              }
            }
          }
          if (!stack.length) {
            return {
              originLength: i - pos,
              body
            };
          }
        }
        throw new Error("Broken JSON " + (str[pos] === "{" ? "object" : "array") + " body near " + body);
      }
      throw new Error("Broken JSON body near " + str.substr(pos - 5 >= 0 ? pos - 5 : 0, 50));
    }
    canBeKeyHead(ch) {
      if (ch[0] === "\\") return false;
      if (ch[0] >= "a" && ch[0] <= "z" || ch[0] >= "A" && ch[0] <= "Z" || ch[0] === "_") return true;
      if (ch[0] >= "0" && ch[0] <= "9") return true;
      if (ch[0] === "$") return true;
      if (ch.charCodeAt(0) > 255) return true;
      return false;
    }
    isBlankChar(ch) {
      return ch === " " || ch === "\n" || ch === "	";
    }
  }
  class RequestBuilder {
    constructor(element, handler, options) {
      this.options = options || {};
      this.ogElement = element;
      this.element = this.findElement(element);
      if (!this.element) {
        return Request.send(handler, this.options);
      }
      this.assignAsEval("beforeSendFunc", "requestBeforeSend");
      this.assignAsEval("beforeUpdateFunc", "requestBeforeUpdate");
      this.assignAsEval("afterUpdateFunc", "requestAfterUpdate");
      this.assignAsEval("successFunc", "requestSuccess");
      this.assignAsEval("errorFunc", "requestError");
      this.assignAsEval("cancelFunc", "requestCancel");
      this.assignAsEval("completeFunc", "requestComplete");
      this.assignAsData("progressBar", "requestProgressBar");
      this.assignAsData("message", "requestMessage");
      this.assignAsData("confirm", "requestConfirm");
      this.assignAsData("redirect", "requestRedirect");
      this.assignAsData("loading", "requestLoading");
      this.assignAsData("form", "requestForm");
      this.assignAsData("url", "requestUrl");
      this.assignAsData("bulk", "requestBulk", { emptyAsTrue: true });
      this.assignAsData("files", "requestFiles", { emptyAsTrue: true });
      this.assignAsData("flash", "requestFlash", { emptyAsTrue: true });
      this.assignAsData("download", "requestDownload", { emptyAsTrue: true });
      this.assignAsData("update", "requestUpdate", { parseJson: true });
      this.assignAsData("query", "requestQuery", { emptyAsTrue: true, parseJson: true });
      this.assignAsData("browserTarget", "browserTarget");
      this.assignAsData("browserValidate", "browserValidate", { emptyAsTrue: true });
      this.assignAsData("browserRedirectBack", "browserRedirectBack", { emptyAsTrue: true });
      this.assignAsMetaData("update", "ajaxRequestUpdate", { parseJson: true, mergeValue: true });
      this.assignRequestData();
      if (!handler) {
        handler = this.getHandlerName();
      }
      return Request.sendElement(this.element, handler, this.options);
    }
    static fromElement(element, handler, options) {
      if (typeof element === "string") {
        element = document.querySelector(element);
      }
      return new RequestBuilder(element, handler, options);
    }
    // Event target may some random node inside the data-request container
    // so it should bubble up but also capture the ogElement in case it is
    // a button that contains data-request-data.
    findElement(element) {
      if (!element || element === document) {
        return null;
      }
      if (element.matches("[data-request]")) {
        return element;
      }
      var parentEl = element.closest("[data-request]");
      if (parentEl) {
        return parentEl;
      }
      return element;
    }
    getHandlerName() {
      if (this.element.dataset.dataRequest) {
        return this.element.dataset.dataRequest;
      }
      return this.element.getAttribute("data-request");
    }
    assignAsEval(optionName, name) {
      if (this.options[optionName] !== void 0) {
        return;
      }
      var attrVal;
      if (this.element.dataset[name]) {
        attrVal = this.element.dataset[name];
      } else {
        attrVal = this.element.getAttribute("data-" + normalizeDataKey(name));
      }
      if (!attrVal) {
        return;
      }
      this.options[optionName] = function(element, context, data) {
        return new Function("context", "data", attrVal).apply(element, [context, data]);
      };
    }
    assignAsData(optionName, name, { parseJson = false, emptyAsTrue = false } = {}) {
      if (this.options[optionName] !== void 0) {
        return;
      }
      var attrVal;
      if (this.element.dataset[name]) {
        attrVal = this.element.dataset[name];
      } else {
        attrVal = this.element.getAttribute("data-" + normalizeDataKey(name));
      }
      if (attrVal === null) {
        return;
      }
      attrVal = this.castAttrToOption(attrVal, emptyAsTrue);
      if (parseJson && typeof attrVal === "string") {
        attrVal = JsonParser.paramToObj(
          "data-" + normalizeDataKey(name),
          attrVal
        );
      }
      this.options[optionName] = attrVal;
    }
    assignAsMetaData(optionName, name, { mergeValue = true, parseJson = false, emptyAsTrue = false } = {}) {
      const meta = document.documentElement.querySelector('head meta[name="' + normalizeDataKey(name) + '"]');
      if (!meta) {
        return;
      }
      var attrVal = meta.getAttribute("content");
      if (parseJson) {
        attrVal = JsonParser.paramToObj(normalizeDataKey(name), attrVal);
      } else {
        attrVal = this.castAttrToOption(attrVal, emptyAsTrue);
      }
      if (mergeValue) {
        this.options[optionName] = {
          ...this.options[optionName] || {},
          ...attrVal
        };
      } else {
        this.options[optionName] = attrVal;
      }
    }
    castAttrToOption(val, emptyAsTrue) {
      if (emptyAsTrue && val === "") {
        return true;
      }
      if (val === "true" || val === "1") {
        return true;
      }
      if (val === "false" || val === "0") {
        return false;
      }
      return val;
    }
    assignRequestData() {
      const data = {};
      if (this.options.data) {
        Object.assign(data, this.options.data);
      }
      const attr = this.ogElement.getAttribute("data-request-data");
      if (attr) {
        Object.assign(data, JsonParser.paramToObj("data-request-data", attr));
      }
      elementParents(this.ogElement, "[data-request-data]").reverse().forEach(function(el) {
        Object.assign(data, JsonParser.paramToObj(
          "data-request-data",
          el.getAttribute("data-request-data")
        ));
      });
      this.options.data = data;
    }
  }
  function elementParents(element, selector) {
    const parents = [];
    if (!element.parentNode) {
      return parents;
    }
    let ancestor = element.parentNode.closest(selector);
    while (ancestor) {
      parents.push(ancestor);
      ancestor = ancestor.parentNode.closest(selector);
    }
    return parents;
  }
  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
  }
  let Controller$2 = class Controller {
    constructor() {
      this.started = false;
      this.documentVisible = true;
    }
    start() {
      if (!this.started) {
        window.onbeforeunload = this.documentOnBeforeUnload;
        addEventListener("DOMContentLoaded", () => this.render());
        addEventListener("page:updated", () => this.render());
        addEventListener("ajax:update-complete", () => this.render());
        addEventListener("visibilitychange", () => this.documentOnVisibilityChange());
        Events.on(document, "submit", "[data-request]", this.documentOnSubmit);
        Events.on(document, "input", "input[data-request][data-track-input]", this.documentOnKeyup);
        Events.on(document, "change", "select[data-request], input[type=radio][data-request], input[type=checkbox][data-request], input[type=file][data-request]", this.documentOnChange);
        Events.on(document, "keydown", "input[type=text][data-request], input[type=submit][data-request], input[type=password][data-request]", this.documentOnKeydown);
        Events.on(document, "click", "a[data-request], button[data-request], input[type=button][data-request], input[type=submit][data-request]", this.documentOnClick);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
      }
    }
    render(event) {
      Events.dispatch("before-render");
      Events.dispatch("render");
      dispatchEvent(new Event("resize"));
      this.documentOnRender(event);
    }
    documentOnVisibilityChange(event) {
      this.documentVisible = !document.hidden;
      if (this.documentVisible) {
        this.documentOnRender();
      }
    }
    documentOnRender(event) {
      if (!this.documentVisible) {
        return;
      }
      document.querySelectorAll("[data-auto-submit]").forEach(function(el) {
        const interval = el.dataset.autoSubmit || 0;
        el.removeAttribute("data-auto-submit");
        setTimeout(function() {
          RequestBuilder.fromElement(el);
        }, interval);
      });
    }
    documentOnSubmit(event) {
      event.preventDefault();
      RequestBuilder.fromElement(event.target);
    }
    documentOnClick(event) {
      event.preventDefault();
      RequestBuilder.fromElement(event.target);
    }
    documentOnChange(event) {
      RequestBuilder.fromElement(event.target);
    }
    documentOnKeyup(event) {
      var el = event.target, lastValue = el.dataset.ocLastValue;
      if (["email", "number", "password", "search", "text"].indexOf(el.type) === -1) {
        return;
      }
      if (lastValue !== void 0 && lastValue == el.value) {
        return;
      }
      el.dataset.ocLastValue = el.value;
      if (this.dataTrackInputTimer !== void 0) {
        clearTimeout(this.dataTrackInputTimer);
      }
      var interval = el.getAttribute("data-track-input");
      if (!interval) {
        interval = 300;
      }
      var self = this;
      this.dataTrackInputTimer = setTimeout(function() {
        if (self.lastDataTrackInputRequest) {
          self.lastDataTrackInputRequest.abort();
        }
        self.lastDataTrackInputRequest = RequestBuilder.fromElement(el);
      }, interval);
    }
    documentOnKeydown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (this.dataTrackInputTimer !== void 0) {
          clearTimeout(this.dataTrackInputTimer);
        }
        RequestBuilder.fromElement(event.target);
      }
    }
    documentOnBeforeUnload(event) {
      window.jaxUnloading = true;
    }
  };
  let Migrate$1 = class Migrate {
    bind() {
      this.bindRequestFunc();
      this.bindRenderFunc();
      this.bindjQueryEvents();
    }
    bindRequestFunc() {
      var old = $.fn.request;
      $.fn.request = function(handler, option) {
        var options = typeof option === "object" ? option : {};
        return new RequestBuilder(this.get(0), handler, options);
      };
      $.fn.request.Constructor = RequestBuilder;
      $.request = function(handler, option) {
        return $(document).request(handler, option);
      };
      $.fn.request.noConflict = function() {
        $.fn.request = old;
        return this;
      };
    }
    bindRenderFunc() {
      $.fn.render = function(callback) {
        $(document).on("render", callback);
      };
    }
    bindjQueryEvents() {
      this.migratejQueryEvent(document, "ajax:setup", "ajaxSetup", ["context"]);
      this.migratejQueryEvent(document, "ajax:promise", "ajaxPromise", ["context"]);
      this.migratejQueryEvent(document, "ajax:fail", "ajaxFail", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:done", "ajaxDone", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:always", "ajaxAlways", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:before-redirect", "ajaxRedirect");
      this.migratejQueryEvent(document, "ajax:update", "ajaxUpdate", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:before-replace", "ajaxBeforeReplace");
      this.migratejQueryEvent(document, "ajax:before-request", "oc.beforeRequest", ["context"]);
      this.migratejQueryEvent(document, "ajax:before-update", "ajaxBeforeUpdate", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:request-success", "ajaxSuccess", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:request-complete", "ajaxComplete", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:request-error", "ajaxError", ["context", "message", "responseCode", "xhr"]);
      this.migratejQueryEvent(document, "ajax:before-validate", "ajaxValidation", ["context", "message", "fields"]);
      this.migratejQueryEvent(window, "ajax:before-send", "ajaxBeforeSend", ["context"]);
      this.migratejQueryEvent(window, "ajax:update-complete", "ajaxUpdateComplete", ["context", "data", "responseCode", "xhr"]);
      this.migratejQueryEvent(window, "ajax:invalid-field", "ajaxInvalidField", ["element", "fieldName", "errorMsg", "isFirst"]);
      this.migratejQueryEvent(window, "ajax:confirm-message", "ajaxConfirmMessage", ["message", "promise"]);
      this.migratejQueryEvent(window, "ajax:error-message", "ajaxErrorMessage", ["message"]);
      this.migratejQueryAttachData(document, "ajax:setup", "a[data-request], button[data-request], form[data-request], a[data-handler], button[data-handler]");
    }
    // Private
    migratejQueryEvent(target, jsName, jqName, detailNames = []) {
      var self = this;
      $(target).on(jsName, function(ev) {
        self.triggerjQueryEvent(ev.originalEvent, jqName, detailNames);
      });
    }
    triggerjQueryEvent(ev, eventName, detailNames = []) {
      var jQueryEvent = $.Event(eventName), args = this.buildDetailArgs(ev, detailNames);
      $(ev.target).trigger(jQueryEvent, args);
      if (jQueryEvent.isDefaultPrevented()) {
        ev.preventDefault();
      }
    }
    buildDetailArgs(ev, detailNames) {
      var args = [];
      detailNames.forEach(function(name) {
        args.push(ev.detail[name]);
      });
      return args;
    }
    // For instances where data() is populated in the jQ instance
    migratejQueryAttachData(target, eventName, selector) {
      $(target).on(eventName, selector, function(event) {
        var dataObj = $(this).data("request-data");
        if (!dataObj) {
          return;
        }
        var options = event.detail.context.options;
        if (dataObj.constructor === {}.constructor) {
          Object.assign(options.data, dataObj);
        } else if (typeof dataObj === "string") {
          Object.assign(options.data, JsonParser.paramToObj("request-data", dataObj));
        }
      });
    }
  };
  const controller$2 = new Controller$2();
  const namespace$3 = {
    controller: controller$2,
    parseJSON: JsonParser.parseJSON,
    serializeAsJSON: FormSerializer.serializeAsJSON,
    requestElement: RequestBuilder.fromElement,
    start() {
      controller$2.start();
      if (window.jQuery) {
        new Migrate$1().bind();
      }
    },
    stop() {
      controller$2.stop();
    }
  };
  if (!window.jax) {
    window.jax = {};
  }
  if (!window.jax.AjaxFramework) {
    window.jax.AjaxFramework = namespace$3;
    window.jax.request = namespace$3.requestElement;
    window.jax.parseJSON = namespace$3.parseJSON;
    window.jax.values = namespace$3.serializeAsJSON;
    window.jax.waitFor = waitFor;
    window.jax.pageReady = domReady;
    window.jax.Events = Events;
    window.jax.dispatch = Events.dispatch;
    window.jax.trigger = Events.trigger;
    window.jax.on = Events.on;
    window.jax.off = Events.off;
    window.jax.one = Events.one;
    window.jax.visit = (url) => window.location.assign(url);
    if (!isAMD$3() && !isCommonJS$3()) {
      namespace$3.start();
    }
  }
  function isAMD$3() {
    return typeof define == "function" && define.amd;
  }
  function isCommonJS$3() {
    return typeof exports == "object" && typeof module != "undefined";
  }
  class Validator {
    submit(el) {
      var form = el.closest("form");
      if (!form) {
        return;
      }
      form.querySelectorAll("[data-validate-for]").forEach(function(el2) {
        el2.classList.remove("oc-visible");
      });
      form.querySelectorAll("[data-validate-error]").forEach(function(el2) {
        el2.classList.remove("oc-visible");
      });
    }
    validate(el, fields, errorMsg, allowDefault) {
      var form = el.closest("form"), messages = [];
      if (!form) {
        return;
      }
      for (var fieldName in fields) {
        var fieldMessages = fields[fieldName];
        messages = [...messages, ...fieldMessages];
        var field = form.querySelector('[data-validate-for="' + fieldName + '"]');
        if (field) {
          if (!field.innerHTML || field.dataset.emptyMode) {
            field.dataset.emptyMode = true;
            field.innerHTML = fieldMessages.join(", ");
          }
          field.classList.add("oc-visible");
        }
      }
      var container = form.querySelector("[data-validate-error]");
      if (container) {
        container.classList.add("oc-visible");
        var oldMessages = container.querySelectorAll("[data-message]");
        if (oldMessages.length > 0) {
          var clone = oldMessages[0];
          messages.forEach(function(message) {
            var newNode = clone.cloneNode(true);
            newNode.innerHTML = message;
            clone.parentNode.insertBefore(newNode, clone.nextSibling);
          });
          oldMessages.forEach(function(el2) {
            el2.remove();
          });
        } else {
          container.innerHTML = errorMsg;
        }
      }
      if (allowDefault) {
        return;
      }
      Events.one(form, "ajax:request-error", function(event) {
        event.preventDefault();
      });
    }
  }
  const _AttachLoader = class _AttachLoader {
    constructor() {
      this.stylesheetElement = this.createStylesheetElement();
    }
    static get defaultCSS() {
      return unindent`
        .oc-attach-loader:after {
            content: '';
            display: inline-block;
            vertical-align: middle;
            margin-left: .4em;
            height: 1em;
            width: 1em;
            animation: oc-rotate-loader 0.8s infinite linear;
            border: .2em solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            opacity: .5;
        }
        @keyframes oc-rotate-loader {
            0% { transform: rotate(0deg); }
            100%  { transform: rotate(360deg); }
        }
    `;
    }
    static get attachLoader() {
      return {
        show: function(el) {
          new _AttachLoader().show(resolveElement(el));
        },
        hide: function(el) {
          new _AttachLoader().hide(resolveElement(el));
        },
        hideAll: function() {
          new _AttachLoader().hideAll();
        }
      };
    }
    // Public
    show(el) {
      this.installStylesheetElement();
      if (isElementInput(el)) {
        const loadEl = document.createElement("span");
        loadEl.className = "oc-attach-loader is-inline";
        el.parentNode.insertBefore(loadEl, el.nextSibling);
      } else {
        el.classList.add("oc-attach-loader");
        el.disabled = true;
      }
    }
    hide(el) {
      if (isElementInput(el)) {
        if (el.nextElementSibling && el.nextElementSibling.classList.contains("oc-attach-loader")) {
          el.nextElementSibling.remove();
        }
      } else {
        el.classList.remove("oc-attach-loader");
        el.disabled = false;
      }
    }
    hideAll() {
      document.querySelectorAll(".oc-attach-loader.is-inline").forEach((el) => {
        el.remove();
      });
      document.querySelectorAll(".oc-attach-loader").forEach((el) => {
        el.classList.remove("oc-attach-loader");
        el.disabled = false;
      });
    }
    showForm(el) {
      if (el.dataset.attachLoading !== void 0) {
        this.show(el);
      }
      if (el.matches("form")) {
        var self = this;
        el.querySelectorAll("[data-attach-loading][type=submit]").forEach(function(otherEl) {
          if (!isElementInput(otherEl)) {
            self.show(otherEl);
          }
        });
      }
    }
    hideForm(el) {
      if (el.dataset.attachLoading !== void 0) {
        this.hide(el);
      }
      if (el.matches("form")) {
        var self = this;
        el.querySelectorAll("[data-attach-loading]").forEach(function(otherEl) {
          if (!isElementInput(otherEl)) {
            self.hide(otherEl);
          }
        });
      }
    }
    // Private
    installStylesheetElement() {
      if (!_AttachLoader.stylesheetReady) {
        document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
        _AttachLoader.stylesheetReady = true;
      }
    }
    createStylesheetElement() {
      const element = document.createElement("style");
      element.textContent = _AttachLoader.defaultCSS;
      return element;
    }
  };
  __publicField(_AttachLoader, "stylesheetReady", false);
  let AttachLoader = _AttachLoader;
  function isElementInput(el) {
    return ["input", "select", "textarea"].includes((el.tagName || "").toLowerCase());
  }
  function resolveElement(el) {
    if (typeof el === "string") {
      el = document.querySelector(el);
    }
    if (!el) {
      throw new Error("Invalid element for attach loader.");
    }
    return el;
  }
  const _FlashMessage = class _FlashMessage {
    constructor() {
      this.queue = [];
      this.lastUniqueId = 0;
      this.displayedMessage = null;
      this.stylesheetElement = this.createStylesheetElement();
    }
    static get defaultCSS() {
      return unindent`
        .oc-flash-message {
            display: flex;
            position: fixed;
            z-index: 10300;
            width: 500px;
            left: 50%;
            top: 50px;
            margin-left: -250px;
            color: #fff;
            font-size: 1rem;
            padding: 10px 15px;
            border-radius: 5px;
            opacity: 0;
            transition: all 0.5s, width 0s;
            transform: scale(0.9);
        }
        @media (max-width: 768px) {
            .oc-flash-message {
                left: 1rem;
                right: 1rem;
                top: 1rem;
                margin-left: 0;
                width: auto;
            }
        }
        .oc-flash-message.flash-show {
            opacity: 1;
            transform: scale(1);
        }
        .oc-flash-message.loading {
            transition: opacity 0.2s;
            transform: scale(1);
        }
        .oc-flash-message.success {
            background: #86cb43;
        }
        .oc-flash-message.error {
            background: #cc3300;
        }
        .oc-flash-message.warning {
            background: #f0ad4e;
        }
        .oc-flash-message.info, .oc-flash-message.loading {
            background: #5fb6f5;
        }
        .oc-flash-message span.flash-message {
            flex-grow: 1;
        }
        .oc-flash-message a.flash-close {
            box-sizing: content-box;
            width: 1em;
            height: 1em;
            padding: .25em .25em;
            background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23FFF'%3e%3cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
            border: 0;
            border-radius: .25rem;
            opacity: .5;
            text-decoration: none;
            cursor: pointer;
        }
        .oc-flash-message a.flash-close:hover,
        .oc-flash-message a.flash-close:focus {
            opacity: 1;
        }
        .oc-flash-message.loading a.flash-close {
            display: none;
        }
        .oc-flash-message span.flash-loader {
            margin-right: 1em;
        }
        .oc-flash-message span.flash-loader:after {
            position: relative;
            top: 2px;
            content: '';
            display: inline-block;
            height: 1.2em;
            width: 1.2em;
            animation: oc-flash-loader 0.8s infinite linear;
            border: .2em solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            opacity: .5;
        }
        html[data-turbo-preview] .oc-flash-message {
            opacity: 0;
        }
        @keyframes oc-flash-loader {
            0% { transform: rotate(0deg); }
            100%  { transform: rotate(360deg); }
        }
    `;
    }
    static flashMsg(options) {
      return getOrCreateInstance().show(options);
    }
    runQueue() {
      if (this.displayedMessage) {
        return;
      }
      var options = this.queue.shift();
      if (options === void 0) {
        return;
      }
      this.buildFlashMessage(options);
    }
    clearQueue() {
      this.queue = [];
      if (this.displayedMessage && this.displayedMessage.uniqueId) {
        this.hide(this.displayedMessage.uniqueId, true);
      }
    }
    removeFromQueue(uniqueId) {
      for (var index = 0; index < this.queue.length; index++) {
        if (this.queue[index].uniqueId == uniqueId) {
          this.queue.splice(index, 1);
          return;
        }
      }
    }
    show(options = {}) {
      this.installStylesheetElement();
      let {
        message = "",
        type = "info",
        replace = null,
        hideAll = false
      } = options;
      if (options.text) message = options.text;
      if (options.class) type = options.class;
      if (hideAll || type === "error" || type === "loading") {
        this.clearQueue();
      }
      if (replace) {
        if (this.displayedMessage && replace === this.displayedMessage.uniqueId) {
          this.hide(replace, true);
        } else {
          this.removeFromQueue(replace);
        }
      }
      if (!message) {
        return;
      }
      var uniqueId = this.makeUniqueId();
      this.queue.push({
        ...options,
        uniqueId
      });
      this.runQueue();
      return uniqueId;
    }
    makeUniqueId() {
      return ++this.lastUniqueId;
    }
    buildFlashMessage(options = {}) {
      let {
        message = "",
        type = "info",
        target = null,
        interval = 3
      } = options;
      if (options.text) message = options.text;
      if (options.class) type = options.class;
      if (target) {
        target.removeAttribute("data-control");
      }
      var flashElement = this.createFlashElement(message, type);
      this.createMessagesElement().appendChild(flashElement);
      this.displayedMessage = {
        uniqueId: options.uniqueId,
        element: flashElement,
        options
      };
      var remove = (event) => {
        clearInterval(timer);
        flashElement.removeEventListener("click", pause);
        flashElement.removeEventListener("extras:flash-remove", remove);
        flashElement.querySelector(".flash-close").removeEventListener("click", remove);
        flashElement.classList.remove("flash-show");
        if (event && event.detail.isReplace) {
          flashElement.remove();
          this.displayedMessage = null;
          this.runQueue();
        } else {
          setTimeout(() => {
            flashElement.remove();
            this.displayedMessage = null;
            this.runQueue();
          }, 600);
        }
      };
      var pause = () => {
        clearInterval(timer);
      };
      flashElement.addEventListener("click", pause, { once: true });
      flashElement.addEventListener("extras:flash-remove", remove, { once: true });
      flashElement.querySelector(".flash-close").addEventListener("click", remove, { once: true });
      var timer;
      if (interval && interval !== 0) {
        timer = setTimeout(remove, interval * 1e3);
      }
      setTimeout(() => {
        flashElement.classList.add("flash-show");
      }, 20);
    }
    render() {
      document.querySelectorAll("[data-control=flash-message]").forEach((el) => {
        this.show({ ...el.dataset, target: el, message: el.innerHTML });
        el.remove();
      });
    }
    hide(uniqueId, isReplace) {
      if (this.displayedMessage && uniqueId === this.displayedMessage.uniqueId) {
        this.displayedMessage.element.dispatchEvent(new CustomEvent("extras:flash-remove", {
          detail: { isReplace }
        }));
      }
    }
    hideAll() {
      this.clearQueue();
      this.displayedMessage = null;
      document.querySelectorAll(".oc-flash-message, [data-control=flash-message]").forEach((el) => {
        el.remove();
      });
    }
    createFlashElement(message, type) {
      const element = document.createElement("div");
      const loadingHtml = type === "loading" ? '<span class="flash-loader"></span>' : "";
      const closeHtml = '<a class="flash-close"></a>';
      element.className = "oc-flash-message " + type;
      element.innerHTML = loadingHtml + '<span class="flash-message">' + message + "</span>" + closeHtml;
      return element;
    }
    // Private
    installStylesheetElement() {
      if (!_FlashMessage.stylesheetReady) {
        document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
        _FlashMessage.stylesheetReady = true;
      }
    }
    createStylesheetElement() {
      const element = document.createElement("style");
      element.textContent = _FlashMessage.defaultCSS;
      return element;
    }
    createMessagesElement() {
      const found = document.querySelector(".oc-flash-messages");
      if (found) {
        return found;
      }
      const element = document.createElement("div");
      element.className = "oc-flash-messages";
      document.body.appendChild(element);
      return element;
    }
  };
  __publicField(_FlashMessage, "instance", null);
  __publicField(_FlashMessage, "stylesheetReady", false);
  let FlashMessage = _FlashMessage;
  function getOrCreateInstance() {
    if (!FlashMessage.instance) {
      FlashMessage.instance = new FlashMessage();
    }
    return FlashMessage.instance;
  }
  let Controller$1 = class Controller {
    constructor() {
      this.started = false;
      this.enableProgressBar = function(event) {
        const { options } = event.detail.context;
        if (options.progressBar === null) {
          options.progressBar = true;
        }
      };
      this.showAttachLoader = (event) => {
        this.attachLoader.showForm(event.target);
      };
      this.hideAttachLoader = (event) => {
        this.attachLoader.hideForm(event.target);
      };
      this.hideAllAttachLoaders = (event) => {
        this.attachLoader.hideAll();
      };
      this.validatorSubmit = (event) => {
        this.validator.submit(event.target);
      };
      this.validatorValidate = (event) => {
        this.validator.validate(
          event.target,
          event.detail.fields,
          event.detail.message,
          shouldShowFlashMessage(event.detail.context.options.flash, "validate")
        );
      };
      this.flashMessageBind = (event) => {
        const { options } = event.detail.context;
        if (options.flash) {
          options.handleErrorMessage = (message) => {
            if (message && shouldShowFlashMessage(options.flash, "error") || shouldShowFlashMessage(options.flash, "validate")) {
              this.flashMessage.show({ message, type: "error" });
            }
          };
          options.handleFlashMessage = (message, type) => {
            if (message && shouldShowFlashMessage(options.flash, type)) {
              this.flashMessage.show({ message, type });
            }
          };
        }
        var context = event.detail;
        options.handleProgressMessage = (message, isDone) => {
          if (!isDone) {
            context.progressMessageId = this.flashMessage.show({ message, type: "loading", interval: 10 });
          } else {
            this.flashMessage.show(context.progressMessageId ? { replace: context.progressMessageId } : { hideAll: true });
            context = null;
          }
        };
      };
      this.flashMessageRender = (event) => {
        this.flashMessage.render();
      };
      this.hideAllFlashMessages = (event) => {
        this.flashMessage.hideAll();
      };
      this.handleBrowserRedirect = function(event) {
        if (event.defaultPrevented) {
          return;
        }
        const href = getReferrerUrl();
        if (!href) {
          return;
        }
        event.preventDefault();
        if (jax.useTurbo && jax.useTurbo()) {
          jax.visit(href);
        } else {
          location.assign(href);
        }
      };
    }
    start() {
      if (!this.started) {
        addEventListener("ajax:setup", this.enableProgressBar);
        this.attachLoader = new AttachLoader();
        Events.on(document, "ajax:promise", "form, [data-attach-loading]", this.showAttachLoader);
        Events.on(document, "ajax:fail", "form, [data-attach-loading]", this.hideAttachLoader);
        Events.on(document, "ajax:done", "form, [data-attach-loading]", this.hideAttachLoader);
        addEventListener("page:before-cache", this.hideAllAttachLoaders);
        this.validator = new Validator();
        Events.on(document, "ajax:before-validate", "[data-request-validate]", this.validatorValidate);
        Events.on(document, "ajax:promise", "[data-request-validate]", this.validatorSubmit);
        this.flashMessage = new FlashMessage();
        addEventListener("render", this.flashMessageRender);
        addEventListener("ajax:setup", this.flashMessageBind);
        addEventListener("page:before-cache", this.hideAllFlashMessages);
        Events.on(document, "click", "[data-browser-redirect-back]", this.handleBrowserRedirect);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("ajax:setup", this.enableProgressBar);
        this.attachLoader = null;
        Events.off(document, "ajax:promise", "form, [data-attach-loading]", this.showAttachLoader);
        Events.off(document, "ajax:fail", "form, [data-attach-loading]", this.hideAttachLoader);
        Events.off(document, "ajax:done", "form, [data-attach-loading]", this.hideAttachLoader);
        removeEventListener("page:before-cache", this.hideAllAttachLoaders);
        this.validator = null;
        Events.off(document, "ajax:before-validate", "[data-request-validate]", this.validatorValidate);
        Events.off(document, "ajax:promise", "[data-request-validate]", this.validatorSubmit);
        this.flashMessage = null;
        removeEventListener("render", this.flashMessageRender);
        removeEventListener("ajax:setup", this.flashMessageBind);
        removeEventListener("page:before-cache", this.hideAllFlashMessages);
        Events.off(document, "click", "[data-browser-redirect-back]", this.handleBrowserRedirect);
        this.started = false;
      }
    }
  };
  function shouldShowFlashMessage(value, type) {
    if (value === true && type !== "validate") {
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }
    if (value === "*") {
      return true;
    }
    let result = false;
    value.split(",").forEach(function(validType) {
      if (validType.trim() === type) {
        result = true;
      }
    });
    return result;
  }
  class Migrate {
    bind() {
      if ($.oc === void 0) {
        $.oc = {};
      }
      $.oc.flashMsg = window.jax.flashMsg;
      $.oc.stripeLoadIndicator = window.jax.progressBar;
    }
  }
  const controller$1 = new Controller$1();
  const namespace$2 = {
    controller: controller$1,
    flashMsg: FlashMessage.flashMsg,
    progressBar: ProgressBar.progressBar,
    attachLoader: AttachLoader.attachLoader,
    start() {
      controller$1.start();
      if (window.jQuery) {
        new Migrate().bind();
      }
    },
    stop() {
      controller$1.stop();
    }
  };
  if (!window.jax) {
    window.jax = {};
  }
  if (!window.jax.AjaxExtras) {
    window.jax.AjaxExtras = namespace$2;
    window.jax.flashMsg = namespace$2.flashMsg;
    window.jax.progressBar = namespace$2.progressBar;
    window.jax.attachLoader = namespace$2.attachLoader;
    if (!isAMD$2() && !isCommonJS$2()) {
      namespace$2.start();
    }
  }
  function isAMD$2() {
    return typeof define == "function" && define.amd;
  }
  function isCommonJS$2() {
    return typeof exports == "object" && typeof module != "undefined";
  }
  const _ControlBase = class _ControlBase {
    static get shouldLoad() {
      return true;
    }
    static afterLoad(_identifier, _application) {
      return;
    }
    constructor(context) {
      this.context = context;
      this.config = { ...context.scope.element.dataset || {} };
    }
    get application() {
      return this.context.application;
    }
    get scope() {
      return this.context.scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    init() {
    }
    connect() {
    }
    disconnect() {
    }
    // Internal events avoid the need to call parent logic
    initBefore() {
      this.proxiedEvents = {};
      this.proxiedMethods = {};
    }
    initAfter() {
    }
    connectBefore() {
    }
    connectAfter() {
    }
    disconnectBefore() {
    }
    disconnectAfter() {
      for (const key in this.proxiedEvents) {
        this.forget(...this.proxiedEvents[key]);
        delete this.proxiedEvents[key];
      }
      for (const key in this.proxiedMethods) {
        this.proxiedMethods[key] = void 0;
      }
    }
    // Events
    listen(eventName, targetOrHandler, handlerOrOptions, options) {
      if (typeof targetOrHandler === "string") {
        jax.Events.on(this.element, eventName, targetOrHandler, this.proxy(handlerOrOptions), options);
      } else if (targetOrHandler instanceof Element) {
        jax.Events.on(targetOrHandler, eventName, this.proxy(handlerOrOptions), options);
      } else {
        jax.Events.on(this.element, eventName, this.proxy(targetOrHandler), handlerOrOptions);
      }
      _ControlBase.proxyCounter++;
      this.proxiedEvents[_ControlBase.proxyCounter] = arguments;
    }
    forget(eventName, targetOrHandler, handlerOrOptions, options) {
      if (typeof targetOrHandler === "string") {
        jax.Events.off(this.element, eventName, targetOrHandler, this.proxy(handlerOrOptions), options);
      } else if (targetOrHandler instanceof Element) {
        jax.Events.off(targetOrHandler, eventName, this.proxy(handlerOrOptions), options);
      } else {
        jax.Events.off(this.element, eventName, this.proxy(targetOrHandler), handlerOrOptions);
      }
      const compareArrays = (a, b) => {
        if (a.length === b.length) {
          for (var i = 0; i < a.length; i++) {
            if (a[i] === b[i]) {
              return true;
            }
          }
        }
        return false;
      };
      for (const key in this.proxiedEvents) {
        if (compareArrays(arguments, this.proxiedEvents[key])) {
          delete this.proxiedEvents[key];
        }
      }
    }
    dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true } = {}) {
      const type = prefix ? `${prefix}:${eventName}` : eventName;
      const event = new CustomEvent(type, { detail, bubbles, cancelable });
      target.dispatchEvent(event);
      return event;
    }
    proxy(method) {
      if (method.ocProxyId === void 0) {
        _ControlBase.proxyCounter++;
        method.ocProxyId = _ControlBase.proxyCounter;
      }
      if (this.proxiedMethods[method.ocProxyId] !== void 0) {
        return this.proxiedMethods[method.ocProxyId];
      }
      this.proxiedMethods[method.ocProxyId] = method.bind(this);
      return this.proxiedMethods[method.ocProxyId];
    }
  };
  __publicField(_ControlBase, "proxyCounter", 0);
  let ControlBase = _ControlBase;
  class EventListener {
    constructor(eventTarget, eventName, eventOptions) {
      this.eventTarget = eventTarget;
      this.eventName = eventName;
      this.eventOptions = eventOptions;
      this.unorderedBindings = /* @__PURE__ */ new Set();
    }
    connect() {
      this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
    }
    disconnect() {
      this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
    }
    // Binding observer delegate
    bindingConnected(binding) {
      this.unorderedBindings.add(binding);
    }
    bindingDisconnected(binding) {
      this.unorderedBindings.delete(binding);
    }
    handleEvent(event) {
      const extendedEvent = extendEvent(event);
      for (const binding of this.bindings) {
        if (extendedEvent.immediatePropagationStopped) {
          break;
        } else {
          binding.handleEvent(extendedEvent);
        }
      }
    }
    hasBindings() {
      return this.unorderedBindings.size > 0;
    }
    get bindings() {
      return Array.from(this.unorderedBindings).sort((left, right) => {
        const leftIndex = left.index, rightIndex = right.index;
        return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
      });
    }
  }
  function extendEvent(event) {
    if ("immediatePropagationStopped" in event) {
      return event;
    } else {
      const { stopImmediatePropagation } = event;
      return Object.assign(event, {
        immediatePropagationStopped: false,
        stopImmediatePropagation() {
          this.immediatePropagationStopped = true;
          stopImmediatePropagation.call(this);
        }
      });
    }
  }
  class Dispatcher {
    constructor(application2) {
      this.application = application2;
      this.eventListenerMaps = /* @__PURE__ */ new Map();
      this.started = false;
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.eventListeners.forEach((eventListener) => eventListener.connect());
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.eventListeners.forEach((eventListener) => eventListener.disconnect());
      }
    }
    get eventListeners() {
      return Array.from(this.eventListenerMaps.values()).reduce((listeners, map) => listeners.concat(Array.from(map.values())), []);
    }
    // Binding observer delegate
    bindingConnected(binding) {
      this.fetchEventListenerForBinding(binding).bindingConnected(binding);
    }
    bindingDisconnected(binding, clearEventListeners = false) {
      this.fetchEventListenerForBinding(binding).bindingDisconnected(binding);
      if (clearEventListeners)
        this.clearEventListenersForBinding(binding);
    }
    // Error handling
    handleError(error, message, detail = {}) {
      this.application.handleError(error, `Error ${message}`, detail);
    }
    clearEventListenersForBinding(binding) {
      const eventListener = this.fetchEventListenerForBinding(binding);
      if (!eventListener.hasBindings()) {
        eventListener.disconnect();
        this.removeMappedEventListenerFor(binding);
      }
    }
    removeMappedEventListenerFor(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      eventListenerMap.delete(cacheKey);
      if (eventListenerMap.size == 0) {
        this.eventListenerMaps.delete(eventTarget);
      }
    }
    fetchEventListenerForBinding(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      return this.fetchEventListener(eventTarget, eventName, eventOptions);
    }
    fetchEventListener(eventTarget, eventName, eventOptions) {
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      let eventListener = eventListenerMap.get(cacheKey);
      if (!eventListener) {
        eventListener = this.createEventListener(eventTarget, eventName, eventOptions);
        eventListenerMap.set(cacheKey, eventListener);
      }
      return eventListener;
    }
    createEventListener(eventTarget, eventName, eventOptions) {
      const eventListener = new EventListener(eventTarget, eventName, eventOptions);
      if (this.started) {
        eventListener.connect();
      }
      return eventListener;
    }
    fetchEventListenerMapForEventTarget(eventTarget) {
      let eventListenerMap = this.eventListenerMaps.get(eventTarget);
      if (!eventListenerMap) {
        eventListenerMap = /* @__PURE__ */ new Map();
        this.eventListenerMaps.set(eventTarget, eventListenerMap);
      }
      return eventListenerMap;
    }
    cacheKey(eventName, eventOptions) {
      const parts = [eventName];
      Object.keys(eventOptions).sort().forEach((key) => {
        parts.push(`${eventOptions[key] ? "" : "!"}${key}`);
      });
      return parts.join(":");
    }
  }
  class Context {
    constructor(module2, scope) {
      this.module = module2;
      this.scope = scope;
      this.control = new module2.controlConstructor(this);
      try {
        this.control.initBefore();
        this.control.init();
        this.control.initAfter();
      } catch (error) {
        this.handleError(error, "initializing control");
      }
    }
    connect() {
      try {
        this.control.connectBefore();
        this.control.connect();
        this.control.connectAfter();
      } catch (error) {
        this.handleError(error, "connecting control");
      }
    }
    refresh() {
    }
    disconnect() {
      try {
        this.control.disconnectBefore();
        this.control.disconnect();
        this.control.disconnectAfter();
      } catch (error) {
        this.handleError(error, "disconnecting control");
      }
    }
    get application() {
      return this.module.application;
    }
    get identifier() {
      return this.module.identifier;
    }
    get dispatcher() {
      return this.application.dispatcher;
    }
    get element() {
      return this.scope.element;
    }
    get parentElement() {
      return this.element.parentElement;
    }
    // Error handling
    handleError(error, message, detail = {}) {
      const { identifier, control, element } = this;
      detail = Object.assign({ identifier, control, element }, detail);
      this.application.handleError(error, `Error ${message}`, detail);
    }
  }
  class Module {
    constructor(application2, definition) {
      this.application = application2;
      this.definition = blessDefinition(definition);
      this.contextsByScope = /* @__PURE__ */ new WeakMap();
      this.connectedContexts = /* @__PURE__ */ new Set();
    }
    get identifier() {
      return this.definition.identifier;
    }
    get controlConstructor() {
      return this.definition.controlConstructor;
    }
    get contexts() {
      return Array.from(this.connectedContexts);
    }
    connectContextForScope(scope) {
      const context = this.fetchContextForScope(scope);
      this.connectedContexts.add(context);
      context.connect();
    }
    disconnectContextForScope(scope) {
      const context = this.contextsByScope.get(scope);
      if (context) {
        this.connectedContexts.delete(context);
        context.disconnect();
      }
    }
    fetchContextForScope(scope) {
      let context = this.contextsByScope.get(scope);
      if (!context) {
        context = new Context(this, scope);
        this.contextsByScope.set(scope, context);
      }
      return context;
    }
  }
  function blessDefinition(definition) {
    return {
      identifier: definition.identifier,
      controlConstructor: definition.controlConstructor
    };
  }
  class Scope {
    constructor(element, identifier) {
      this.element = element;
      this.identifier = identifier;
      this.containsElement = (element2) => {
        return element2.closest(this.controlSelector) === this.element;
      };
    }
    findElement(selector) {
      return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
    }
    findAllElements(selector) {
      return [
        ...this.element.matches(selector) ? [this.element] : [],
        ...this.queryElements(selector).filter(this.containsElement)
      ];
    }
    queryElements(selector) {
      return Array.from(this.element.querySelectorAll(selector));
    }
    get controlSelector() {
      return attributeValueContainsToken("data-control", this.identifier);
    }
    get isDocumentScope() {
      return this.element === document.documentElement;
    }
    get documentScope() {
      return this.isDocumentScope ? this : new Scope(document.documentElement, this.identifier);
    }
  }
  function attributeValueContainsToken(attributeName, token) {
    return `[${attributeName}~="${token}"]`;
  }
  class ElementObserver {
    constructor(element, delegate) {
      this.mutationObserverInit = { attributes: true, childList: true, subtree: true };
      this.element = element;
      this.started = false;
      this.delegate = delegate;
      this.elements = /* @__PURE__ */ new Set();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.refresh();
      }
    }
    pause(callback) {
      if (this.started) {
        this.mutationObserver.disconnect();
        this.started = false;
      }
      callback();
      if (!this.started) {
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        const matches = new Set(this.matchElementsInTree());
        for (const element of Array.from(this.elements)) {
          if (!matches.has(element)) {
            this.removeElement(element);
          }
        }
        for (const element of Array.from(matches)) {
          this.addElement(element);
        }
      }
    }
    // Mutation record processing
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      if (mutation.type == "attributes") {
        this.processAttributeChange(mutation.target, mutation.attributeName);
      } else if (mutation.type == "childList") {
        this.processRemovedNodes(mutation.removedNodes);
        this.processAddedNodes(mutation.addedNodes);
      }
    }
    processAttributeChange(element, attributeName) {
      if (this.elements.has(element)) {
        if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
          this.delegate.elementAttributeChanged(element, attributeName);
        } else {
          this.removeElement(element);
        }
      } else if (this.matchElement(element)) {
        this.addElement(element);
      }
    }
    processRemovedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element) {
          this.processTree(element, this.removeElement);
        }
      }
    }
    processAddedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element && this.elementIsActive(element)) {
          this.processTree(element, this.addElement);
        }
      }
    }
    // Element matching
    matchElement(element) {
      return this.delegate.matchElement(element);
    }
    matchElementsInTree(tree = this.element) {
      return this.delegate.matchElementsInTree(tree);
    }
    processTree(tree, processor) {
      for (const element of this.matchElementsInTree(tree)) {
        processor.call(this, element);
      }
    }
    elementFromNode(node) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        return node;
      }
    }
    elementIsActive(element) {
      if (element.isConnected != this.element.isConnected) {
        return false;
      } else {
        return this.element.contains(element);
      }
    }
    // Element tracking
    addElement(element) {
      if (!this.elements.has(element)) {
        if (this.elementIsActive(element)) {
          this.elements.add(element);
          if (this.delegate.elementMatched) {
            this.delegate.elementMatched(element);
          }
        }
      }
    }
    removeElement(element) {
      if (this.elements.has(element)) {
        this.elements.delete(element);
        if (this.delegate.elementUnmatched) {
          this.delegate.elementUnmatched(element);
        }
      }
    }
  }
  class AttributeObserver {
    constructor(element, attributeName, delegate) {
      this.delegate = delegate;
      this.attributeName = attributeName;
      this.elementObserver = new ElementObserver(element, this);
    }
    get element() {
      return this.elementObserver.element;
    }
    get selector() {
      return `[${this.attributeName}]`;
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get started() {
      return this.elementObserver.started;
    }
    // Element observer delegate
    matchElement(element) {
      return element.hasAttribute(this.attributeName);
    }
    matchElementsInTree(tree) {
      const match = this.matchElement(tree) ? [tree] : [];
      const matches = Array.from(tree.querySelectorAll(this.selector));
      return match.concat(matches);
    }
    elementMatched(element) {
      if (this.delegate.elementMatchedAttribute) {
        this.delegate.elementMatchedAttribute(element, this.attributeName);
      }
    }
    elementUnmatched(element) {
      if (this.delegate.elementUnmatchedAttribute) {
        this.delegate.elementUnmatchedAttribute(element, this.attributeName);
      }
    }
    elementAttributeChanged(element, attributeName) {
      if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
        this.delegate.elementAttributeValueChanged(element, attributeName);
      }
    }
  }
  function add(map, key, value) {
    fetch(map, key).add(value);
  }
  function del(map, key, value) {
    fetch(map, key).delete(value);
    prune(map, key);
  }
  function fetch(map, key) {
    let values = map.get(key);
    if (!values) {
      values = /* @__PURE__ */ new Set();
      map.set(key, values);
    }
    return values;
  }
  function prune(map, key) {
    const values = map.get(key);
    if (values != null && values.size == 0) {
      map.delete(key);
    }
  }
  class Multimap {
    constructor() {
      this.valuesByKey = /* @__PURE__ */ new Map();
    }
    get keys() {
      return Array.from(this.valuesByKey.keys());
    }
    get values() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((values, set) => values.concat(Array.from(set)), React.createElement(V, null), [] > []);
    }
    get size() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((size, set) => size + set.size, 0);
    }
    add(key, value) {
      add(this.valuesByKey, key, value);
    }
    delete(key, value) {
      del(this.valuesByKey, key, value);
    }
    has(key, value) {
      const values = this.valuesByKey.get(key);
      return values != null && values.has(value);
    }
    hasKey(key) {
      return this.valuesByKey.has(key);
    }
    hasValue(value) {
      const sets = Array.from(this.valuesByKey.values());
      return sets.some((set) => set.has(value));
    }
    getValuesForKey(key) {
      const values = this.valuesByKey.get(key);
      return values ? Array.from(values) : [];
    }
    getKeysForValue(value) {
      return Array.from(this.valuesByKey).filter(([_key, values]) => values.has(value)).map(([key, _values]) => key);
    }
  }
  class TokenListObserver {
    constructor(element, attributeName, delegate) {
      this.delegate = delegate;
      this.attributeObserver = new AttributeObserver(element, attributeName, this);
      this.tokensByElement = new Multimap();
    }
    get started() {
      return this.attributeObserver.started;
    }
    start() {
      this.attributeObserver.start();
    }
    pause(callback) {
      this.attributeObserver.pause(callback);
    }
    stop() {
      this.attributeObserver.stop();
    }
    refresh() {
      this.attributeObserver.refresh();
    }
    get element() {
      return this.attributeObserver.element;
    }
    get attributeName() {
      return this.attributeObserver.attributeName;
    }
    // Attribute observer delegate
    elementMatchedAttribute(element) {
      this.tokensMatched(this.readTokensForElement(element));
    }
    elementAttributeValueChanged(element) {
      const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element);
      this.tokensUnmatched(unmatchedTokens);
      this.tokensMatched(matchedTokens);
    }
    elementUnmatchedAttribute(element) {
      this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
    }
    tokensMatched(tokens) {
      tokens.forEach((token) => this.tokenMatched(token));
    }
    tokensUnmatched(tokens) {
      tokens.forEach((token) => this.tokenUnmatched(token));
    }
    tokenMatched(token) {
      this.delegate.tokenMatched(token);
      this.tokensByElement.add(token.element, token);
    }
    tokenUnmatched(token) {
      this.delegate.tokenUnmatched(token);
      this.tokensByElement.delete(token.element, token);
    }
    refreshTokensForElement(element) {
      const previousTokens = this.tokensByElement.getValuesForKey(element);
      const currentTokens = this.readTokensForElement(element);
      const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken));
      if (firstDifferingIndex == -1) {
        return [[], []];
      } else {
        return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
      }
    }
    readTokensForElement(element) {
      const attributeName = this.attributeName;
      const tokenString = element.getAttribute(attributeName) || "";
      return parseTokenString(tokenString, element, attributeName);
    }
  }
  function parseTokenString(tokenString, element, attributeName) {
    return tokenString.trim().split(/\s+/).filter((content) => content.length).map((content, index) => ({ element, attributeName, content, index }));
  }
  function zip(left, right) {
    const length = Math.max(left.length, right.length);
    return Array.from({ length }, (_, index) => [left[index], right[index]]);
  }
  function tokensAreEqual(left, right) {
    return left && right && left.index == right.index && left.content == right.content;
  }
  class ValueListObserver {
    constructor(element, attributeName, delegate) {
      this.tokenListObserver = new TokenListObserver(element, attributeName, this);
      this.delegate = delegate;
      this.parseResultsByToken = /* @__PURE__ */ new WeakMap();
      this.valuesByTokenByElement = /* @__PURE__ */ new WeakMap();
    }
    get started() {
      return this.tokenListObserver.started;
    }
    start() {
      this.tokenListObserver.start();
    }
    stop() {
      this.tokenListObserver.stop();
    }
    refresh() {
      this.tokenListObserver.refresh();
    }
    get element() {
      return this.tokenListObserver.element;
    }
    get attributeName() {
      return this.tokenListObserver.attributeName;
    }
    tokenMatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).set(token, value);
        this.delegate.elementMatchedValue(element, value);
      }
    }
    tokenUnmatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).delete(token);
        this.delegate.elementUnmatchedValue(element, value);
      }
    }
    fetchParseResultForToken(token) {
      let parseResult = this.parseResultsByToken.get(token);
      if (!parseResult) {
        parseResult = this.parseToken(token);
        this.parseResultsByToken.set(token, parseResult);
      }
      return parseResult;
    }
    fetchValuesByTokenForElement(element) {
      let valuesByToken = this.valuesByTokenByElement.get(element);
      if (!valuesByToken) {
        valuesByToken = /* @__PURE__ */ new Map();
        this.valuesByTokenByElement.set(element, valuesByToken);
      }
      return valuesByToken;
    }
    parseToken(token) {
      try {
        const value = this.delegate.parseValueForToken(token);
        return { value };
      } catch (error) {
        return { error };
      }
    }
  }
  class ScopeObserver {
    constructor(element, delegate) {
      this.element = element;
      this.delegate = delegate;
      this.valueListObserver = new ValueListObserver(this.element, this.controlAttribute, this);
      this.scopesByIdentifierByElement = /* @__PURE__ */ new WeakMap();
      this.scopeReferenceCounts = /* @__PURE__ */ new WeakMap();
    }
    start() {
      this.valueListObserver.start();
    }
    stop() {
      this.valueListObserver.stop();
    }
    get controlAttribute() {
      return "data-control";
    }
    // Value observer delegate
    parseValueForToken(token) {
      const { element, content: identifier } = token;
      const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
      let scope = scopesByIdentifier.get(identifier);
      if (!scope) {
        scope = this.delegate.createScopeForElementAndIdentifier(element, identifier);
        scopesByIdentifier.set(identifier, scope);
      }
      return scope;
    }
    elementMatchedValue(element, value) {
      const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
      this.scopeReferenceCounts.set(value, referenceCount);
      if (referenceCount == 1) {
        this.delegate.scopeConnected(value);
      }
    }
    elementUnmatchedValue(element, value) {
      const referenceCount = this.scopeReferenceCounts.get(value);
      if (referenceCount) {
        this.scopeReferenceCounts.set(value, referenceCount - 1);
        if (referenceCount == 1) {
          this.delegate.scopeDisconnected(value);
        }
      }
    }
    fetchScopesByIdentifierForElement(element) {
      let scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
      if (!scopesByIdentifier) {
        scopesByIdentifier = /* @__PURE__ */ new Map();
        this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
      }
      return scopesByIdentifier;
    }
  }
  class Container {
    constructor(application2) {
      this.application = application2;
      this.scopeObserver = new ScopeObserver(this.element, this);
      this.scopesByIdentifier = new Multimap();
      this.modulesByIdentifier = /* @__PURE__ */ new Map();
    }
    get element() {
      return this.application.element;
    }
    get modules() {
      return Array.from(this.modulesByIdentifier.values());
    }
    get contexts() {
      return this.modules.reduce((contexts, module2) => contexts.concat(module2.contexts), []);
    }
    start() {
      this.scopeObserver.start();
    }
    stop() {
      this.scopeObserver.stop();
    }
    loadDefinition(definition) {
      this.unloadIdentifier(definition.identifier);
      const module2 = new Module(this.application, definition);
      this.connectModule(module2);
      const afterLoad = definition.controlConstructor.afterLoad;
      if (afterLoad) {
        afterLoad.call(definition.controlConstructor, definition.identifier, this.application);
      }
    }
    unloadIdentifier(identifier) {
      const module2 = this.modulesByIdentifier.get(identifier);
      if (module2) {
        this.disconnectModule(module2);
      }
    }
    getModuleForIdentifier(identifier) {
      return this.modulesByIdentifier.get(identifier);
    }
    getContextForElementAndIdentifier(element, identifier) {
      const module2 = this.modulesByIdentifier.get(identifier);
      if (module2) {
        return module2.contexts.find((context) => context.element == element);
      }
    }
    // Error handler delegate
    handleError(error, message, detail) {
      this.application.handleError(error, message, detail);
    }
    // Scope observer delegate
    createScopeForElementAndIdentifier(element, identifier) {
      return new Scope(element, identifier);
    }
    scopeConnected(scope) {
      this.scopesByIdentifier.add(scope.identifier, scope);
      const module2 = this.modulesByIdentifier.get(scope.identifier);
      if (module2) {
        module2.connectContextForScope(scope);
      }
    }
    scopeDisconnected(scope) {
      this.scopesByIdentifier.delete(scope.identifier, scope);
      const module2 = this.modulesByIdentifier.get(scope.identifier);
      if (module2) {
        module2.disconnectContextForScope(scope);
      }
    }
    // Modules
    connectModule(module2) {
      this.modulesByIdentifier.set(module2.identifier, module2);
      const scopes = this.scopesByIdentifier.getValuesForKey(module2.identifier);
      scopes.forEach((scope) => module2.connectContextForScope(scope));
    }
    disconnectModule(module2) {
      this.modulesByIdentifier.delete(module2.identifier);
      const scopes = this.scopesByIdentifier.getValuesForKey(module2.identifier);
      scopes.forEach((scope) => module2.disconnectContextForScope(scope));
    }
  }
  class Application {
    constructor() {
      this.started = false;
      this.element = document.documentElement;
      this.dispatcher = new Dispatcher(this);
      this.container = new Container(this);
    }
    startAsync() {
      domReady().then(() => {
        this.start();
      });
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.dispatcher.start();
        this.container.start();
      }
    }
    stop() {
      if (this.started) {
        this.dispatcher.stop();
        this.container.stop();
        this.started = false;
      }
    }
    register(identifier, controlConstructor) {
      this.load({ identifier, controlConstructor });
    }
    observe(element, identifier) {
      const observer = this.container.scopeObserver;
      observer.elementMatchedValue(element, observer.parseValueForToken({
        element,
        content: identifier
      }));
      const foundControl = this.getControlForElementAndIdentifier(element, identifier);
      if (!element.matches(`[data-control~="${identifier}"]`)) {
        element.dataset.control = ((element.dataset.control || "") + " " + identifier).trim();
      }
      return foundControl;
    }
    import(identifier) {
      const module2 = this.container.getModuleForIdentifier(identifier);
      if (!module2) {
        throw new Error(`Control is not registered [${identifier}]`);
      }
      return module2.controlConstructor;
    }
    fetch(element, identifier) {
      if (typeof element === "string") {
        element = document.querySelector(element);
      }
      if (!identifier) {
        identifier = element.dataset.control;
      }
      return element ? this.getControlForElementAndIdentifier(element, identifier) : null;
    }
    fetchAll(elements, identifier) {
      if (typeof elements === "string") {
        elements = document.querySelectorAll(elements);
      }
      const result = [];
      elements.forEach((element) => {
        const control = this.fetch(element, identifier);
        if (control) {
          result.push(control);
        }
      });
      return result;
    }
    load(head, ...rest) {
      const definitions = Array.isArray(head) ? head : [head, ...rest];
      definitions.forEach((definition) => {
        if (definition.controlConstructor.shouldLoad) {
          this.container.loadDefinition(definition);
        }
      });
    }
    unload(head, ...rest) {
      const identifiers = Array.isArray(head) ? head : [head, ...rest];
      identifiers.forEach((identifier) => this.container.unloadIdentifier(identifier));
    }
    // Controls
    get controls() {
      return this.container.contexts.map((context) => context.control);
    }
    getControlForElementAndIdentifier(element, identifier) {
      const context = this.container.getContextForElementAndIdentifier(element, identifier);
      return context ? context.control : null;
    }
    // Error handling
    handleError(error, message, detail) {
      var _a;
      console.error(`%s

%o

%o`, message, error, detail);
      (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, message, "", 0, 0, error);
    }
  }
  const application = new Application();
  const namespace$1 = {
    application,
    registerControl(id, control) {
      return application.register(id, control);
    },
    importControl(id) {
      return application.import(id);
    },
    observeControl(element, id) {
      return application.observe(element, id);
    },
    fetchControl(element, identifier) {
      return application.fetch(element, identifier);
    },
    fetchControls(elements, identifier) {
      return application.fetchAll(elements, identifier);
    },
    start() {
      application.startAsync();
    },
    stop() {
      application.stop();
    }
  };
  if (!window.jax) {
    window.jax = {};
  }
  if (!window.jax.AjaxObserve) {
    window.jax.AjaxObserve = namespace$1;
    window.jax.ControlBase = ControlBase;
    window.jax.registerControl = namespace$1.registerControl;
    window.jax.importControl = namespace$1.importControl;
    window.jax.observeControl = namespace$1.observeControl;
    window.jax.fetchControl = namespace$1.fetchControl;
    window.jax.fetchControls = namespace$1.fetchControls;
    if (!isAMD$1() && !isCommonJS$1()) {
      namespace$1.start();
    }
  }
  function isAMD$1() {
    return typeof define == "function" && define.amd;
  }
  function isCommonJS$1() {
    return typeof exports == "object" && typeof module != "undefined";
  }
  class BrowserAdapter {
    constructor(controller2) {
      this.progressBar = new ProgressBar();
      this.showProgressBar = () => {
        this.progressBar.show({ cssClass: "is-turbo" });
      };
      this.controller = controller2;
    }
    visitProposedToLocationWithAction(location2, action) {
      const restorationIdentifier = uuid();
      this.controller.startVisitToLocationWithAction(location2, action, restorationIdentifier);
    }
    visitStarted(visit) {
      visit.issueRequest();
      visit.changeHistory();
      visit.goToSamePageAnchor();
      visit.loadCachedSnapshot();
    }
    visitRequestStarted(visit) {
      this.progressBar.setValue(0);
      if (visit.hasCachedSnapshot() || visit.action != "restore") {
        this.showProgressBarAfterDelay();
      } else {
        this.showProgressBar();
      }
    }
    visitRequestProgressed(visit) {
      this.progressBar.setValue(visit.progress);
    }
    visitRequestCompleted(visit) {
      visit.loadResponse();
    }
    visitRequestFailedWithStatusCode(visit, statusCode) {
      switch (statusCode) {
        case SystemStatusCode.networkFailure:
        case SystemStatusCode.timeoutFailure:
        case SystemStatusCode.contentTypeMismatch:
        case SystemStatusCode.userAborted:
          return this.reload();
        default:
          return visit.loadResponse();
      }
    }
    visitRequestFinished(visit) {
      this.hideProgressBar();
    }
    visitCompleted(visit) {
      visit.followRedirect();
    }
    pageInvalidated() {
      this.reload();
    }
    visitFailed(visit) {
    }
    visitRendered(visit) {
    }
    // Private
    showProgressBarAfterDelay() {
      if (this.controller.progressBarVisible) {
        this.progressBarTimeout = window.setTimeout(this.showProgressBar, this.controller.progressBarDelay);
      }
    }
    hideProgressBar() {
      if (this.controller.progressBarVisible) {
        this.progressBar.hide();
        if (this.progressBarTimeout !== null) {
          window.clearTimeout(this.progressBarTimeout);
          delete this.progressBarTimeout;
        }
      }
    }
    reload() {
      window.location.reload();
    }
  }
  class Location {
    constructor(url) {
      const linkWithAnchor = document.createElement("a");
      linkWithAnchor.href = url;
      this.absoluteURL = linkWithAnchor.href;
      const anchorLength = linkWithAnchor.hash.length;
      if (anchorLength < 2) {
        this.requestURL = this.absoluteURL;
      } else {
        this.requestURL = this.absoluteURL.slice(0, -anchorLength);
        this.anchor = linkWithAnchor.hash.slice(1);
      }
    }
    static get currentLocation() {
      return this.wrap(window.location.toString());
    }
    static wrap(locatable) {
      if (typeof locatable == "string") {
        return new Location(locatable);
      } else if (locatable != null) {
        return locatable;
      }
    }
    getOrigin() {
      return this.absoluteURL.split("/", 3).join("/");
    }
    getPath() {
      return (this.requestURL.match(/\/\/[^/]*(\/[^?;]*)/) || [])[1] || "/";
    }
    getPathComponents() {
      return this.getPath().split("/").slice(1);
    }
    getLastPathComponent() {
      return this.getPathComponents().slice(-1)[0];
    }
    getExtension() {
      return (this.getLastPathComponent().match(/\.[^.]*$/) || [])[0] || "";
    }
    isHTML() {
      return this.getExtension().match(/^(?:|\.(?:htm|html|xhtml))$/);
    }
    isPrefixedBy(location2) {
      const prefixURL = getPrefixURL(location2);
      return this.isEqualTo(location2) || stringStartsWith(this.absoluteURL, prefixURL);
    }
    isEqualTo(location2) {
      return location2 && this.absoluteURL === location2.absoluteURL;
    }
    toCacheKey() {
      return this.requestURL;
    }
    toJSON() {
      return this.absoluteURL;
    }
    toString() {
      return this.absoluteURL;
    }
    valueOf() {
      return this.absoluteURL;
    }
  }
  function getPrefixURL(location2) {
    return addTrailingSlash(location2.getOrigin() + location2.getPath());
  }
  function addTrailingSlash(url) {
    return stringEndsWith(url, "/") ? url : url + "/";
  }
  function stringStartsWith(string, prefix) {
    return string.slice(0, prefix.length) === prefix;
  }
  function stringEndsWith(string, suffix) {
    return string.slice(-suffix.length) === suffix;
  }
  class History {
    constructor(delegate) {
      this.started = false;
      this.pageLoaded = false;
      this.onPopState = (event) => {
        if (!this.shouldHandlePopState()) {
          return;
        }
        if (!event.state || !event.state.ajaxTurbo) {
          return;
        }
        const { ajaxTurbo } = event.state;
        const location2 = Location.currentLocation;
        const { restorationIdentifier } = ajaxTurbo;
        this.delegate.historyPoppedToLocationWithRestorationIdentifier(location2, restorationIdentifier);
      };
      this.onPageLoad = (event) => {
        defer(() => {
          this.pageLoaded = true;
        });
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("popstate", this.onPopState, false);
        addEventListener("load", this.onPageLoad, false);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("popstate", this.onPopState, false);
        removeEventListener("load", this.onPageLoad, false);
        this.started = false;
      }
    }
    push(location2, restorationIdentifier) {
      this.update(history.pushState, location2, restorationIdentifier);
    }
    replace(location2, restorationIdentifier) {
      this.update(history.replaceState, location2, restorationIdentifier);
    }
    // Private
    shouldHandlePopState() {
      return this.pageIsLoaded();
    }
    pageIsLoaded() {
      return this.pageLoaded || document.readyState == "complete";
    }
    update(method, location2, restorationIdentifier) {
      const state = { ajaxTurbo: { restorationIdentifier } };
      method.call(history, state, "", location2.absoluteURL);
    }
  }
  class ScrollManager {
    constructor(delegate) {
      this.started = false;
      this.onScroll = () => {
        this.updatePosition({ x: window.pageXOffset, y: window.pageYOffset });
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("scroll", this.onScroll, false);
        this.onScroll();
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("scroll", this.onScroll, false);
        this.started = false;
      }
    }
    scrollToElement(element) {
      element.scrollIntoView();
    }
    scrollToPosition({ x, y }) {
      window.scrollTo(x, y);
    }
    // Private
    updatePosition(position) {
      this.delegate.scrollPositionChanged(position);
    }
  }
  class SnapshotCache {
    constructor(size) {
      this.keys = [];
      this.snapshots = {};
      this.size = size;
    }
    has(location2) {
      return location2.toCacheKey() in this.snapshots;
    }
    get(location2) {
      if (this.has(location2)) {
        const snapshot = this.read(location2);
        this.touch(location2);
        return snapshot;
      }
    }
    put(location2, snapshot) {
      this.write(location2, snapshot);
      this.touch(location2);
      return snapshot;
    }
    // Private
    read(location2) {
      return this.snapshots[location2.toCacheKey()];
    }
    write(location2, snapshot) {
      this.snapshots[location2.toCacheKey()] = snapshot;
    }
    touch(location2) {
      const key = location2.toCacheKey();
      const index = this.keys.indexOf(key);
      if (index > -1)
        this.keys.splice(index, 1);
      this.keys.unshift(key);
      this.trim();
    }
    trim() {
      for (const key of this.keys.splice(this.size)) {
        delete this.snapshots[key];
      }
    }
  }
  class Renderer {
    renderView(callback) {
      const renderInterception = () => {
        callback();
        this.delegate.viewRendered(this.newBody);
      };
      const options = { resume: renderInterception };
      const immediateRender = this.delegate.viewAllowsImmediateRender(this.newBody, options);
      if (immediateRender) {
        renderInterception();
      }
    }
    invalidateView() {
      this.delegate.viewInvalidated();
    }
    createScriptElement(element) {
      if (element.getAttribute("data-turbo-eval") === "false" || this.delegate.applicationHasSeenInlineScript(element)) {
        return element;
      }
      const createdScriptElement = document.createElement("script");
      createdScriptElement.textContent = element.textContent;
      createdScriptElement.async = false;
      copyElementAttributes(createdScriptElement, element);
      return createdScriptElement;
    }
  }
  function copyElementAttributes(destinationElement, sourceElement) {
    for (const { name, value } of array(sourceElement.attributes)) {
      destinationElement.setAttribute(name, value);
    }
  }
  class ErrorRenderer extends Renderer {
    constructor(delegate, html) {
      super();
      this.delegate = delegate;
      this.htmlElement = (() => {
        const htmlElement = document.createElement("html");
        htmlElement.innerHTML = html;
        return htmlElement;
      })();
      this.newHead = this.htmlElement.querySelector("head") || document.createElement("head");
      this.newBody = this.htmlElement.querySelector("body") || document.createElement("body");
    }
    static render(delegate, callback, html) {
      return new this(delegate, html).render(callback);
    }
    render(callback) {
      this.renderView(() => {
        this.replaceHeadAndBody();
        this.activateBodyScriptElements();
        callback();
      });
    }
    replaceHeadAndBody() {
      const { documentElement, head, body } = document;
      documentElement.replaceChild(this.newHead, head);
      documentElement.replaceChild(this.newBody, body);
    }
    activateBodyScriptElements() {
      for (const replaceableElement of this.getScriptElements()) {
        const parentNode = replaceableElement.parentNode;
        if (parentNode) {
          const element = this.createScriptElement(replaceableElement);
          parentNode.replaceChild(element, replaceableElement);
        }
      }
    }
    getScriptElements() {
      return array(document.documentElement.querySelectorAll("script"));
    }
  }
  class HeadDetails {
    constructor(children) {
      this.detailsByOuterHTML = children.reduce((result, element) => {
        const { outerHTML } = element;
        const details = outerHTML in result ? result[outerHTML] : {
          type: elementType(element),
          tracked: elementIsTracked(element),
          elements: []
        };
        return Object.assign(Object.assign({}, result), { [outerHTML]: Object.assign(Object.assign({}, details), { elements: [...details.elements, element] }) });
      }, {});
    }
    static fromHeadElement(headElement) {
      const children = headElement ? array(headElement.children) : [];
      return new this(children);
    }
    getTrackedElementSignature() {
      return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => this.detailsByOuterHTML[outerHTML].tracked).join("");
    }
    getScriptElementsNotInDetails(headDetails) {
      return this.getElementsMatchingTypeNotInDetails("script", headDetails);
    }
    getStylesheetElementsNotInDetails(headDetails) {
      return this.getElementsMatchingTypeNotInDetails("stylesheet", headDetails);
    }
    getElementsMatchingTypeNotInDetails(matchedType, headDetails) {
      return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => !(outerHTML in headDetails.detailsByOuterHTML)).map((outerHTML) => this.detailsByOuterHTML[outerHTML]).filter(({ type }) => type == matchedType).map(({ elements: [element] }) => element);
    }
    getProvisionalElements() {
      return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
        const { type, tracked, elements } = this.detailsByOuterHTML[outerHTML];
        if (type == null && !tracked) {
          return [...result, ...elements];
        } else if (elements.length > 1) {
          return [...result, ...elements.slice(1)];
        } else {
          return result;
        }
      }, []);
    }
    getMetaValue(name) {
      const element = this.findMetaElementByName(name);
      return element ? element.getAttribute("content") : null;
    }
    findMetaElementByName(name) {
      return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
        const { elements: [element] } = this.detailsByOuterHTML[outerHTML];
        return elementIsMetaElementWithName(element, name) ? element : result;
      }, void 0);
    }
  }
  function elementType(element) {
    if (elementIsScript(element)) {
      return "script";
    } else if (elementIsStylesheet(element)) {
      return "stylesheet";
    }
  }
  function elementIsTracked(element) {
    return element.getAttribute("data-turbo-track") == "reload";
  }
  function elementIsScript(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "script";
  }
  function elementIsStylesheet(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "style" || tagName == "link" && element.getAttribute("rel") == "stylesheet";
  }
  function elementIsMetaElementWithName(element, name) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "meta" && element.getAttribute("name") == name;
  }
  class Snapshot {
    constructor(headDetails, bodyElement) {
      this.headDetails = headDetails;
      this.bodyElement = bodyElement;
    }
    static wrap(value) {
      if (value instanceof this) {
        return value;
      } else if (typeof value == "string") {
        return this.fromHTMLString(value);
      } else {
        return this.fromHTMLElement(value);
      }
    }
    static fromHTMLString(html) {
      const element = document.createElement("html");
      element.innerHTML = html;
      return this.fromHTMLElement(element);
    }
    static fromHTMLElement(htmlElement) {
      const headElement = htmlElement.querySelector("head");
      const bodyElement = htmlElement.querySelector("body") || document.createElement("body");
      const headDetails = HeadDetails.fromHeadElement(headElement);
      return new this(headDetails, bodyElement);
    }
    clone() {
      return new Snapshot(this.headDetails, this.bodyElement.cloneNode(true));
    }
    getRootLocation() {
      const root = this.getSetting("root", "/");
      return new Location(root);
    }
    getCacheControlValue() {
      return this.getSetting("cache-control");
    }
    getElementForAnchor(anchor) {
      try {
        return this.bodyElement.querySelector(`[id='${anchor}'], a[name='${anchor}']`);
      } catch (e) {
        return null;
      }
    }
    getPermanentElements() {
      return array(this.bodyElement.querySelectorAll("[id][data-turbo-permanent]"));
    }
    getPermanentElementById(id) {
      return this.bodyElement.querySelector(`#${id}[data-turbo-permanent]`);
    }
    getPermanentElementsPresentInSnapshot(snapshot) {
      return this.getPermanentElements().filter(({ id }) => snapshot.getPermanentElementById(id));
    }
    findFirstAutofocusableElement() {
      return this.bodyElement.querySelector("[autofocus]");
    }
    hasAnchor(anchor) {
      return this.getElementForAnchor(anchor) != null;
    }
    isPreviewable() {
      return this.getCacheControlValue() != "no-preview";
    }
    isCacheable() {
      return this.getCacheControlValue() != "no-cache";
    }
    isNativeError() {
      return this.getSetting("visit-control", false) != false;
    }
    isEnabled() {
      return this.getSetting("visit-control") != "disable";
    }
    isVisitable() {
      return this.isEnabled() && this.getSetting("visit-control") != "reload";
    }
    getSetting(name, defaultValue) {
      const value = this.headDetails.getMetaValue(`turbo-${name}`);
      return value == null ? defaultValue : value;
    }
  }
  class SnapshotRenderer extends Renderer {
    constructor(delegate, currentSnapshot, newSnapshot, isPreview) {
      super();
      this.delegate = delegate;
      this.currentSnapshot = currentSnapshot;
      this.currentHeadDetails = currentSnapshot.headDetails;
      this.newSnapshot = newSnapshot;
      this.newHeadDetails = newSnapshot.headDetails;
      this.newBody = newSnapshot.bodyElement;
      this.isPreview = isPreview;
    }
    static render(delegate, callback, currentSnapshot, newSnapshot, isPreview) {
      return new this(delegate, currentSnapshot, newSnapshot, isPreview).render(callback);
    }
    render(callback) {
      if (this.shouldRender()) {
        this.mergeHead();
        this.renderView(() => {
          this.replaceBody();
          if (!this.isPreview) {
            this.focusFirstAutofocusableElement();
          }
          callback();
        });
      } else {
        this.invalidateView();
      }
    }
    mergeHead() {
      this.copyNewHeadStylesheetElements();
      this.copyNewHeadScriptElements();
      this.removeCurrentHeadProvisionalElements();
      this.copyNewHeadProvisionalElements();
    }
    replaceBody() {
      const placeholders = this.relocateCurrentBodyPermanentElements();
      this.activateNewBodyScriptElements();
      this.assignNewBody();
      this.replacePlaceholderElementsWithClonedPermanentElements(placeholders);
    }
    shouldRender() {
      return this.currentSnapshot.isEnabled() && this.newSnapshot.isVisitable() && this.trackedElementsAreIdentical();
    }
    trackedElementsAreIdentical() {
      return this.currentHeadDetails.getTrackedElementSignature() == this.newHeadDetails.getTrackedElementSignature();
    }
    copyNewHeadStylesheetElements() {
      for (const element of this.getNewHeadStylesheetElements()) {
        document.head.appendChild(element);
      }
    }
    copyNewHeadScriptElements() {
      for (const element of this.getNewHeadScriptElements()) {
        document.head.appendChild(
          this.bindPendingAssetLoadedEventOnce(
            this.createScriptElement(element)
          )
        );
      }
    }
    bindPendingAssetLoadedEventOnce(element) {
      if (!element.hasAttribute("src")) {
        return element;
      }
      var self = this, loadEvent = function() {
        self.delegate.decrementPendingAsset();
        element.removeEventListener("load", loadEvent);
      };
      element.addEventListener("load", loadEvent);
      this.delegate.incrementPendingAsset();
      return element;
    }
    removeCurrentHeadProvisionalElements() {
      for (const element of this.getCurrentHeadProvisionalElements()) {
        document.head.removeChild(element);
      }
    }
    copyNewHeadProvisionalElements() {
      for (const element of this.getNewHeadProvisionalElements()) {
        document.head.appendChild(element);
      }
    }
    relocateCurrentBodyPermanentElements() {
      return this.getCurrentBodyPermanentElements().reduce((placeholders, permanentElement) => {
        const newElement = this.newSnapshot.getPermanentElementById(permanentElement.id);
        if (newElement) {
          const placeholder = createPlaceholderForPermanentElement(permanentElement);
          replaceElementWithElement(permanentElement, placeholder.element);
          replaceElementWithElement(newElement, permanentElement);
          return [...placeholders, placeholder];
        } else {
          return placeholders;
        }
      }, []);
    }
    replacePlaceholderElementsWithClonedPermanentElements(placeholders) {
      for (const { element, permanentElement } of placeholders) {
        const clonedElement = permanentElement.cloneNode(true);
        replaceElementWithElement(element, clonedElement);
      }
    }
    activateNewBodyScriptElements() {
      for (const inertScriptElement of this.getNewBodyScriptElements()) {
        const activatedScriptElement = this.createScriptElement(inertScriptElement);
        replaceElementWithElement(inertScriptElement, activatedScriptElement);
      }
    }
    assignNewBody() {
      replaceElementWithElement(document.body, this.newBody);
    }
    focusFirstAutofocusableElement() {
      const element = this.newSnapshot.findFirstAutofocusableElement();
      if (elementIsFocusable(element)) {
        element.focus();
      }
    }
    getNewHeadStylesheetElements() {
      return this.newHeadDetails.getStylesheetElementsNotInDetails(this.currentHeadDetails);
    }
    getNewHeadScriptElements() {
      return this.newHeadDetails.getScriptElementsNotInDetails(this.currentHeadDetails);
    }
    getCurrentHeadProvisionalElements() {
      return this.currentHeadDetails.getProvisionalElements();
    }
    getNewHeadProvisionalElements() {
      return this.newHeadDetails.getProvisionalElements();
    }
    getCurrentBodyPermanentElements() {
      return this.currentSnapshot.getPermanentElementsPresentInSnapshot(this.newSnapshot);
    }
    getNewBodyScriptElements() {
      return array(this.newBody.querySelectorAll("script"));
    }
  }
  function createPlaceholderForPermanentElement(permanentElement) {
    const element = document.createElement("meta");
    element.setAttribute("name", "turbo-permanent-placeholder");
    element.setAttribute("content", permanentElement.id);
    return { element, permanentElement };
  }
  function replaceElementWithElement(fromElement, toElement) {
    const parentElement = fromElement.parentElement;
    if (parentElement) {
      return parentElement.replaceChild(toElement, fromElement);
    }
  }
  function elementIsFocusable(element) {
    return element && typeof element.focus == "function";
  }
  class View {
    constructor(delegate) {
      this.htmlElement = document.documentElement;
      this.delegate = delegate;
    }
    getRootLocation() {
      return this.getSnapshot().getRootLocation();
    }
    getElementForAnchor(anchor) {
      return this.getSnapshot().getElementForAnchor(anchor);
    }
    getSnapshot() {
      return Snapshot.fromHTMLElement(this.htmlElement);
    }
    render({ snapshot, error, isPreview }, callback) {
      this.markAsPreview(isPreview);
      if (snapshot) {
        this.renderSnapshot(snapshot, isPreview, callback);
      } else {
        this.renderError(error, callback);
      }
    }
    // Private
    markAsPreview(isPreview) {
      if (isPreview) {
        this.htmlElement.setAttribute("data-turbo-preview", "");
      } else {
        this.htmlElement.removeAttribute("data-turbo-preview");
      }
    }
    renderSnapshot(snapshot, isPreview, callback) {
      SnapshotRenderer.render(this.delegate, callback, this.getSnapshot(), snapshot, isPreview || false);
    }
    renderError(error, callback) {
      ErrorRenderer.render(this.delegate, callback, error || "");
    }
  }
  var TimingMetric = {
    visitStart: "visitStart",
    requestStart: "requestStart",
    requestEnd: "requestEnd",
    visitEnd: "visitEnd"
  };
  var VisitState = {
    initialized: "initialized",
    started: "started",
    canceled: "canceled",
    failed: "failed",
    completed: "completed"
  };
  class Visit {
    constructor(controller2, location2, action, restorationIdentifier = uuid()) {
      this.identifier = uuid();
      this.timingMetrics = {};
      this.followedRedirect = false;
      this.historyChanged = false;
      this.progress = 0;
      this.scrolled = false;
      this.snapshotCached = action === "swap";
      this.state = VisitState.initialized;
      this.performScroll = () => {
        if (!this.scrolled) {
          if (this.action == "restore") {
            this.scrollToRestoredPosition() || this.scrollToTop();
          } else {
            this.scrollToAnchor() || this.scrollToTop();
          }
          this.scrolled = true;
        }
      };
      this.controller = controller2;
      this.location = location2;
      this.action = action;
      this.adapter = controller2.adapter;
      this.restorationIdentifier = restorationIdentifier;
      this.isSamePage = this.locationChangeIsSamePage();
    }
    start() {
      if (this.state == VisitState.initialized) {
        this.recordTimingMetric(TimingMetric.visitStart);
        this.state = VisitState.started;
        this.adapter.visitStarted(this);
      }
    }
    cancel() {
      if (this.state == VisitState.started) {
        if (this.request) {
          this.request.abort();
        }
        this.cancelRender();
        this.state = VisitState.canceled;
      }
    }
    complete() {
      if (this.state == VisitState.started) {
        this.recordTimingMetric(TimingMetric.visitEnd);
        this.state = VisitState.completed;
        this.adapter.visitCompleted(this);
        this.controller.visitCompleted(this);
      }
    }
    fail() {
      if (this.state == VisitState.started) {
        this.state = VisitState.failed;
        this.adapter.visitFailed(this);
      }
    }
    changeHistory() {
      if (!this.historyChanged) {
        const actionForHistory = this.location.isEqualTo(this.referrer) ? "replace" : this.action;
        const method = this.getHistoryMethodForAction(actionForHistory);
        method.call(this.controller, this.location, this.restorationIdentifier);
        this.historyChanged = true;
      }
    }
    issueRequest() {
      if (this.shouldIssueRequest() && !this.request) {
        const url = Location.wrap(this.location).absoluteURL;
        const options = {
          method: "GET",
          headers: {},
          htmlOnly: true,
          timeout: 240
        };
        options.headers["Accept"] = "text/html, application/xhtml+xml";
        options.headers["X-PJAX"] = 1;
        if (this.hasCachedSnapshot()) {
          options.headers["X-PJAX-CACHED"] = 1;
        }
        if (this.referrer) {
          options.headers["X-PJAX-REFERRER"] = Location.wrap(this.referrer).absoluteURL;
        }
        this.progress = 0;
        this.request = new HttpRequest(this, url, options);
        this.request.send();
      }
    }
    getCachedSnapshot() {
      const snapshot = this.controller.getCachedSnapshotForLocation(this.location);
      if (snapshot && (!this.location.anchor || snapshot.hasAnchor(this.location.anchor))) {
        if (this.action == "restore" || snapshot.isPreviewable()) {
          return snapshot;
        }
      }
    }
    hasCachedSnapshot() {
      return this.getCachedSnapshot() != null;
    }
    loadCachedSnapshot() {
      const snapshot = this.getCachedSnapshot();
      if (snapshot) {
        const isPreview = this.shouldIssueRequest();
        this.render(() => {
          this.cacheSnapshot();
          if (this.isSamePage) {
            this.performScroll();
            this.adapter.visitRendered(this);
          } else {
            this.controller.render({ snapshot, isPreview }, this.performScroll);
            this.adapter.visitRendered(this);
            if (!isPreview) {
              this.complete();
            }
          }
        });
      }
    }
    loadResponse() {
      const { request, response } = this;
      if (request && response) {
        this.render(() => {
          const snapshot = Snapshot.fromHTMLString(response);
          this.cacheSnapshot();
          if (request.failed && !snapshot.isNativeError()) {
            this.controller.render({ error: response }, this.performScroll);
            this.adapter.visitRendered(this);
            this.fail();
          } else {
            this.controller.render({ snapshot }, this.performScroll);
            this.adapter.visitRendered(this);
            this.complete();
          }
        });
      }
    }
    followRedirect() {
      if (this.redirectedToLocation && !this.followedRedirect) {
        this.location = this.redirectedToLocation;
        this.controller.replaceHistoryWithLocationAndRestorationIdentifier(this.redirectedToLocation, this.restorationIdentifier);
        this.followedRedirect = true;
      }
    }
    goToSamePageAnchor() {
      if (this.isSamePage) {
        this.render(() => {
          this.cacheSnapshot();
          this.performScroll();
          this.adapter.visitRendered(this);
        });
      }
    }
    // HTTP request delegate
    requestStarted() {
      this.recordTimingMetric(TimingMetric.requestStart);
      this.adapter.visitRequestStarted(this);
    }
    requestProgressed(progress) {
      this.progress = progress;
      if (this.adapter.visitRequestProgressed) {
        this.adapter.visitRequestProgressed(this);
      }
    }
    requestCompletedWithResponse(response, statusCode, redirectedToLocation) {
      this.response = response;
      this.redirectedToLocation = Location.wrap(redirectedToLocation);
      this.adapter.visitRequestCompleted(this);
    }
    requestFailedWithStatusCode(statusCode, response) {
      this.response = response;
      this.adapter.visitRequestFailedWithStatusCode(this, statusCode);
    }
    requestFinished() {
      this.recordTimingMetric(TimingMetric.requestEnd);
      this.adapter.visitRequestFinished(this);
    }
    scrollToRestoredPosition() {
      const position = this.restorationData ? this.restorationData.scrollPosition : void 0;
      if (position) {
        this.controller.scrollToPosition(position);
        return true;
      }
    }
    scrollToAnchor() {
      if (this.location.anchor != null) {
        this.controller.scrollToAnchor(this.location.anchor);
        return true;
      }
    }
    scrollToTop() {
      this.controller.scrollToPosition({ x: 0, y: 0 });
    }
    // Instrumentation
    recordTimingMetric(metric) {
      this.timingMetrics[metric] = (/* @__PURE__ */ new Date()).getTime();
    }
    getTimingMetrics() {
      return Object.assign({}, this.timingMetrics);
    }
    // Private
    getHistoryMethodForAction(action) {
      switch (action) {
        case "swap":
        case "replace":
          return this.controller.replaceHistoryWithLocationAndRestorationIdentifier;
        case "advance":
        case "restore":
          return this.controller.pushHistoryWithLocationAndRestorationIdentifier;
      }
    }
    shouldIssueRequest() {
      if (this.action == "restore") {
        return !this.hasCachedSnapshot();
      } else if (this.isSamePage) {
        return false;
      } else {
        return true;
      }
    }
    locationChangeIsSamePage() {
      if (this.action == "swap") {
        return true;
      }
      const lastLocation = this.action == "restore" && this.controller.lastRenderedLocation;
      return this.controller.locationIsSamePageAnchor(lastLocation || this.location);
    }
    cacheSnapshot() {
      if (!this.snapshotCached) {
        this.controller.cacheSnapshot();
        this.snapshotCached = true;
      }
    }
    render(callback) {
      this.cancelRender();
      this.frame = requestAnimationFrame(() => {
        delete this.frame;
        callback.call(this);
      });
    }
    cancelRender() {
      if (this.frame) {
        cancelAnimationFrame(this.frame);
        delete this.frame;
      }
    }
  }
  class Controller {
    constructor() {
      this.adapter = new BrowserAdapter(this);
      this.history = new History(this);
      this.restorationData = {};
      this.scrollManager = new ScrollManager(this);
      this.useScroll = true;
      this.view = new View(this);
      this.cache = new SnapshotCache(10);
      this.enabled = true;
      this.pendingAssets = 0;
      this.progressBarDelay = 500;
      this.progressBarVisible = true;
      this.started = false;
      this.uniqueInlineScripts = [];
      this.currentVisit = null;
      this.historyVisit = null;
      this.pageIsReady = false;
      this.pageLoaded = () => {
        this.pageIsReady = true;
        this.lastRenderedLocation = this.location;
        this.notifyApplicationAfterPageLoad();
        this.notifyApplicationAfterPageAndScriptsLoad();
        this.observeInlineScripts();
      };
      this.clickCaptured = () => {
        removeEventListener("click", this.clickBubbled, false);
        addEventListener("click", this.clickBubbled, false);
      };
      this.clickBubbled = (event) => {
        if (this.enabled && this.clickEventIsSignificant(event)) {
          const link = this.getVisitableLinkForTarget(event.target);
          if (link) {
            const location2 = this.getVisitableLocationForLink(link);
            if (location2 && this.applicationAllowsFollowingLinkToLocation(link, location2)) {
              event.preventDefault();
              const action = this.getActionForLink(link);
              const scroll = this.useScrollForLink(link);
              this.visit(location2, { action, scroll });
            }
          }
        }
      };
    }
    start() {
      if (Controller.supported && !this.started) {
        addEventListener("click", this.clickCaptured, true);
        addEventListener("DOMContentLoaded", this.pageLoaded, false);
        this.scrollManager.start();
        this.startHistory();
        this.started = true;
        this.enabled = this.documentIsEnabled();
      }
    }
    disable() {
      this.enabled = false;
    }
    stop() {
      if (this.started) {
        removeEventListener("click", this.clickCaptured, true);
        removeEventListener("DOMContentLoaded", this.pageLoaded, false);
        this.scrollManager.stop();
        this.stopHistory();
        this.started = false;
      }
    }
    isEnabled() {
      return this.started && this.enabled;
    }
    pageReady() {
      return new Promise((resolve) => {
        if (!this.pageIsReady) {
          addEventListener("render", () => resolve(), { once: true });
        } else {
          resolve();
        }
      });
    }
    clearCache() {
      this.cache = new SnapshotCache(10);
    }
    visit(location2, options = {}) {
      location2 = Location.wrap(location2);
      const action = options.action || "advance";
      if (this.applicationAllowsVisitingLocation(location2, action)) {
        if (this.locationIsVisitable(location2)) {
          this.useScroll = options.scroll !== false;
          this.adapter.visitProposedToLocationWithAction(location2, action);
        } else {
          window.location.href = location2.toString();
        }
      }
    }
    startVisitToLocationWithAction(location2, action, restorationIdentifier) {
      if (Controller.supported) {
        const restorationData = this.getRestorationDataForIdentifier(restorationIdentifier);
        this.startVisit(Location.wrap(location2), action, { restorationData });
      } else {
        window.location.href = location2.toString();
      }
    }
    setProgressBarVisible(value) {
      this.progressBarVisible = value;
    }
    setProgressBarDelay(delay) {
      this.progressBarDelay = delay;
    }
    // History
    startHistory() {
      this.location = Location.currentLocation;
      this.restorationIdentifier = uuid();
      this.history.start();
      this.history.replace(this.location, this.restorationIdentifier);
    }
    stopHistory() {
      this.history.stop();
    }
    getLastVisitUrl() {
      if (this.historyVisit) {
        return this.historyVisit.referrer.absoluteURL;
      }
    }
    pushHistoryWithLocationAndRestorationIdentifier(locatable, restorationIdentifier) {
      this.historyVisit = this.currentVisit;
      this.location = Location.wrap(locatable);
      this.restorationIdentifier = restorationIdentifier;
      this.history.push(this.location, this.restorationIdentifier);
    }
    replaceHistoryWithLocationAndRestorationIdentifier(locatable, restorationIdentifier) {
      this.location = Location.wrap(locatable);
      this.restorationIdentifier = restorationIdentifier;
      this.history.replace(this.location, this.restorationIdentifier);
    }
    // History delegate
    historyPoppedToLocationWithRestorationIdentifier(location2, restorationIdentifier) {
      if (this.enabled) {
        this.location = location2;
        this.restorationIdentifier = restorationIdentifier;
        const restorationData = this.getRestorationDataForIdentifier(restorationIdentifier);
        this.startVisit(location2, "restore", { restorationIdentifier, restorationData, historyChanged: true });
      } else {
        this.adapter.pageInvalidated();
      }
    }
    // Snapshot cache
    getCachedSnapshotForLocation(location2) {
      const snapshot = this.cache.get(location2);
      return snapshot ? snapshot.clone() : snapshot;
    }
    shouldCacheSnapshot() {
      return this.view.getSnapshot().isCacheable();
    }
    cacheSnapshot() {
      if (this.shouldCacheSnapshot()) {
        this.notifyApplicationBeforeCachingSnapshot();
        const snapshot = this.view.getSnapshot();
        const location2 = this.lastRenderedLocation || Location.currentLocation;
        defer(() => this.cache.put(location2, snapshot.clone()));
      }
    }
    // Scrolling
    scrollToAnchor(anchor) {
      const element = this.view.getElementForAnchor(anchor);
      if (element) {
        this.scrollToElement(element);
      } else {
        this.scrollToPosition({ x: 0, y: 0 });
      }
    }
    scrollToElement(element) {
      this.scrollManager.scrollToElement(element);
    }
    scrollToPosition(position) {
      this.scrollManager.scrollToPosition(position);
    }
    // Scroll manager delegate
    scrollPositionChanged(position) {
      const restorationData = this.getCurrentRestorationData();
      restorationData.scrollPosition = position;
    }
    // Pending asset management
    incrementPendingAsset() {
      this.pendingAssets++;
    }
    decrementPendingAsset() {
      this.pendingAssets--;
      if (this.pendingAssets === 0) {
        this.pageIsReady = true;
        this.notifyApplicationAfterPageAndScriptsLoad();
        this.notifyApplicationAfterLoadScripts();
      }
    }
    // View
    render(options, callback) {
      this.view.render(options, callback);
    }
    viewInvalidated() {
      this.adapter.pageInvalidated();
    }
    viewAllowsImmediateRender(newBody, options) {
      this.pageIsReady = false;
      this.notifyApplicationUnload();
      const event = this.notifyApplicationBeforeRender(newBody, options);
      return !event.defaultPrevented;
    }
    viewRendered() {
      this.lastRenderedLocation = this.currentVisit.location;
      this.notifyApplicationAfterRender();
    }
    // Inline script monitoring
    observeInlineScripts() {
      document.documentElement.querySelectorAll("script[data-turbo-eval-once]").forEach((el) => this.applicationHasSeenInlineScript(el));
    }
    applicationHasSeenInlineScript(element) {
      const uid = element.getAttribute("data-turbo-eval-once");
      if (!uid) {
        return false;
      }
      const hasSeen = !!this.uniqueInlineScripts[uid];
      this.uniqueInlineScripts[uid] = true;
      return hasSeen;
    }
    // Application events
    applicationAllowsFollowingLinkToLocation(link, location2) {
      const event = this.notifyApplicationAfterClickingLinkToLocation(link, location2);
      return !event.defaultPrevented;
    }
    applicationAllowsVisitingLocation(location2, action) {
      const event = this.notifyApplicationBeforeVisitingLocation(location2, action);
      return !event.defaultPrevented;
    }
    notifyApplicationAfterClickingLinkToLocation(link, location2) {
      return dispatch("page:click", { target: link, detail: { url: location2.absoluteURL } });
    }
    notifyApplicationBeforeVisitingLocation(location2, action) {
      return dispatch("page:before-visit", { detail: { url: location2.absoluteURL, action } });
    }
    notifyApplicationAfterVisitingLocation(location2) {
      return dispatch("page:visit", { detail: { url: location2.absoluteURL }, cancelable: false });
    }
    notifyApplicationBeforeCachingSnapshot() {
      return dispatch("page:before-cache", { cancelable: false });
    }
    notifyApplicationBeforeRender(newBody, options) {
      return dispatch("page:before-render", { detail: { newBody, ...options } });
    }
    notifyApplicationAfterRender() {
      return dispatch("page:render", { cancelable: false });
    }
    notifyApplicationAfterPageLoad(timing = {}) {
      return dispatch("page:load", { detail: { url: this.location.absoluteURL, timing }, cancelable: false });
    }
    notifyApplicationAfterPageAndScriptsLoad() {
      return dispatch("page:loaded", { cancelable: false });
    }
    notifyApplicationAfterLoadScripts() {
      return dispatch("page:updated", { cancelable: false });
    }
    notifyApplicationUnload() {
      return dispatch("page:unload", { cancelable: false });
    }
    // Private
    startVisit(location2, action, properties) {
      if (this.currentVisit) {
        this.currentVisit.cancel();
      }
      this.currentVisit = this.createVisit(location2, action, properties);
      this.currentVisit.scrolled = !this.useScroll;
      this.currentVisit.start();
      this.notifyApplicationAfterVisitingLocation(location2);
    }
    createVisit(location2, action, properties) {
      const visit = new Visit(this, location2, action, properties.restorationIdentifier);
      visit.restorationData = Object.assign({}, properties.restorationData || {});
      visit.historyChanged = !!properties.historyChanged;
      visit.referrer = this.location;
      return visit;
    }
    visitCompleted(visit) {
      this.notifyApplicationAfterPageLoad(visit.getTimingMetrics());
      if (this.pendingAssets === 0) {
        this.pageIsReady = true;
        this.notifyApplicationAfterPageAndScriptsLoad();
        this.notifyApplicationAfterLoadScripts();
      }
    }
    clickEventIsSignificant(event) {
      return !(event.target && event.target.isContentEditable || event.defaultPrevented || event.which > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
    }
    getVisitableLinkForTarget(target) {
      if (target instanceof Element && this.elementIsVisitable(target)) {
        var container = target.closest("a[href]:not([download])");
        if (container && container.getAttribute("target") && container.getAttribute("target") != "_self") {
          return null;
        }
        return container;
      }
    }
    getVisitableLocationForLink(link) {
      const location2 = new Location(link.getAttribute("href") || "");
      if (this.locationIsVisitable(location2)) {
        return location2;
      }
    }
    getActionForLink(link) {
      const action = link.getAttribute("data-turbo-action");
      return this.isAction(action) ? action : "advance";
    }
    useScrollForLink(link) {
      return link.getAttribute("data-turbo-no-scroll") === null;
    }
    isAction(action) {
      return action == "advance" || action == "replace" || action == "restore" || action == "swap";
    }
    documentIsEnabled() {
      const meta = document.documentElement.querySelector('head meta[name="turbo-visit-control"]');
      if (meta) {
        return meta.getAttribute("content") != "disable";
      }
      return true;
    }
    elementIsVisitable(element) {
      const container = element.closest("[data-turbo]");
      if (container) {
        return container.getAttribute("data-turbo") != "false";
      } else {
        return true;
      }
    }
    locationIsVisitable(location2) {
      return location2.isPrefixedBy(this.view.getRootLocation()) && location2.isHTML();
    }
    locationIsSamePageAnchor(location2) {
      return typeof location2.anchor != "undefined" && location2.requestURL == this.location.requestURL;
    }
    getCurrentRestorationData() {
      return this.getRestorationDataForIdentifier(this.restorationIdentifier);
    }
    getRestorationDataForIdentifier(identifier) {
      if (!(identifier in this.restorationData)) {
        this.restorationData[identifier] = {};
      }
      return this.restorationData[identifier];
    }
  }
  Controller.supported = !!(window.history.pushState && window.requestAnimationFrame && window.addEventListener);
  const controller = new Controller();
  const namespace = {
    get supported() {
      return Controller.supported;
    },
    controller,
    visit(location2, options) {
      controller.visit(location2, options);
    },
    clearCache() {
      controller.clearCache();
    },
    setProgressBarVisible(value) {
      controller.setProgressBarVisible(value);
    },
    setProgressBarDelay(delay) {
      controller.setProgressBarDelay(delay);
    },
    start() {
      controller.start();
    },
    isEnabled() {
      return controller.isEnabled();
    },
    pageReady() {
      return controller.pageReady();
    }
  };
  if (!window.jax) {
    window.jax = {};
  }
  if (!window.jax.AjaxTurbo) {
    window.jax.AjaxTurbo = namespace;
    window.jax.visit = namespace.visit;
    window.jax.useTurbo = namespace.isEnabled;
    window.jax.pageReady = namespace.pageReady;
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
})();
