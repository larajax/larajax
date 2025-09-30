import { AssetManager } from "./asset-manager";
import { DomPatcher, resolveSelectorResponse } from "./dom-patcher";
import { Deferred } from "../util/deferred";
import { getReferrerUrl } from "../util/referrer";
import { decoratePromiseProxy } from "../util/promise";

export class Actions
{
    constructor(delegate, context, options) {
        this.el = delegate.el;
        this.delegate = delegate;
        this.context = context;
        this.options = options;

        // Allow override to call parent logic
        this.context.start = this.start.bind(this);
        this.context.success = decoratePromiseProxy(this.success, this);
        this.context.error = decoratePromiseProxy(this.error, this);
        this.context.complete = decoratePromiseProxy(this.complete, this);
        this.context.cancel = this.cancel.bind(this);
    }

    // Options can override all public methods in this class
    invoke(method, args) {
        if (this.options[method]) {
            return this.options[method].apply(this.context, args);
        }

        // beforeUpdate and afterUpdate are not part of context
        // since they have no base logic and won't exist here
        if (this[method]) {
            return this[method](...args);
        }
    }

    // Options can also specify a non-interference "func" method, typically
    // used by eval-based data attributes that takes minimal arguments
    invokeFunc(method, data) {
        if (this.options[method]) {
            return this.options[method](this.el, data);
        }
    }

    // Public
    start(xhr) {
        this.invoke('markAsUpdating', [true]);

        if (this.delegate.options.message) {
            this.invoke('handleProgressMessage', [this.delegate.options.message, false]);
        }
    }

    async success(data, responseCode, xhr) {
        // Halt here if beforeUpdate() or data-request-before-update returns false
        if (this.invoke('beforeUpdate', [data, responseCode, xhr]) === false) {
            return;
        }

        // Halt here if the error function returns false
        if (this.invokeFunc('beforeUpdateFunc', data) === false) {
            return;
        }

        // Trigger 'ajaxBeforeUpdate' on the form, halt if event.preventDefault() is called
        if (!this.delegate.applicationAllowsUpdate(data, responseCode, xhr)) {
            return;
        }

        // Download file and continue with success response here since data is unusable
        if (this.delegate.options.download && data instanceof Blob) {
            this.invoke('handleFileDownload', [data, xhr]);
            this.delegate.notifyApplicationRequestSuccess(data, responseCode, xhr);
            this.invokeFunc('successFunc', data);
            return;
        }

        // Proceed with the update process
        if (!data.$env?.isFatal()) {
            await this.invoke('handleUpdateOperations', [data, responseCode, xhr]);
            await this.invoke('handleUpdateResponse', [data, responseCode, xhr]);
        }

        this.delegate.notifyApplicationRequestSuccess(data, responseCode, xhr);
        this.invokeFunc('successFunc', data);
    }

    async error(data, responseCode, xhr) {
        let errorMsg = data.$env?.getMessage();

        if (window.ocUnloading !== undefined && window.ocUnloading) {
            return updatePromise;
        }

        // Disable redirects
        this.delegate.toggleRedirect(false);

        if (!data.$env?.isFatal()) {
            await this.invoke('handleUpdateOperations', [data, responseCode, xhr]);
            await this.invoke('handleUpdateResponse', [data, responseCode, xhr]);
        }
        // Standard error with standard response text
        else {
            if (data.constructor === {}.constructor) {
                if (!errorMsg && data.message) {
                    errorMsg = data.message;
                }
                else {
                    errorMsg = "Something went wrong! Check the browser console.";
                    console.warn(data);
                }
            }
            else {
                errorMsg = data;
            }
        }

        // Capture the error message on the node
        if (this.el !== document) {
            this.el.setAttribute('data-error-message', errorMsg);
        }

        // Trigger 'ajaxError' on the form, halt if event.preventDefault() is called
        if (!this.delegate.applicationAllowsError(data, responseCode, xhr)) {
            return;
        }

        // Halt here if the error function returns false
        if (this.invokeFunc('errorFunc', data) === false) {
            return;
        }

        this.invoke('handleErrorMessage', [errorMsg]);
    }

    async complete(data, responseCode, xhr) {
        this.delegate.notifyApplicationRequestComplete(data, responseCode, xhr);
        this.invokeFunc('completeFunc', data);
        this.invoke('markAsUpdating', [false]);

        if (this.delegate.options.message) {
            this.invoke('handleProgressMessage', [null, true]);
        }
    }

    cancel() {
        this.invokeFunc('cancelFunc');
    }

    // Custom function, requests confirmation from the user
    handleConfirmMessage(message) {
        let resolveFn, rejectFn;

        const promise = new Promise((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });

        promise
            .then(() => { this.delegate.sendInternal(); })
            .catch(() => { this.invoke('cancel', []); });

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
                this.invoke('cancel', []);
            }
            return result;
        }
    }

    // Custom function, display a progress message to the user
    handleProgressMessage(message, isDone) {}

    // Custom function, display a flash message to the user
    handleFlashMessage(message, type) {}

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
            var fieldCheck,
                fieldNameOptions = [];

            // field1[field2][field3]
            fieldCheck = fieldName.replace(/\.(\w+)/g, '[$1]');
            fieldNameOptions.push('[name="'+fieldCheck+'"]:not([disabled])');
            fieldNameOptions.push('[name="'+fieldCheck+'[]"]:not([disabled])');

            // [field1][field2][field3]
            fieldCheck = ('.'+fieldName).replace(/\.(\w+)/g, '[$1]');
            fieldNameOptions.push('[name$="'+fieldCheck+'"]:not([disabled])');
            fieldNameOptions.push('[name$="'+fieldCheck+'[]"]:not([disabled])');

            // field.0 → field[]
            var fieldEmpty = fieldName.replace(/\.[0-9]+$/g, '');
            if (fieldName !== fieldEmpty) {
                fieldCheck = fieldEmpty.replace(/\.(\w+)/g, '[$1]');
                fieldNameOptions.push('[name="'+fieldCheck+'[]"]:not([disabled])');

                fieldCheck = ('.'+fieldEmpty).replace(/\.(\w+)/g, '[$1]');
                fieldNameOptions.push('[name$="'+fieldCheck+'[]"]:not([disabled])');
            }

            var fieldElement = this.delegate.formEl.querySelector(fieldNameOptions.join(', '));
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
            const isAsync = dispatched?.async === true;

            if (isAsync) {
                // Wait until the listener calls resolve() or reject()
                await new Promise((outerResolve, outerReject) => {
                    let settled = false;
                    const resolve = (v) => { if (!settled) { settled = true; outerResolve(v); } };
                    const reject = (e) => { if (!settled) { settled = true; outerReject(e); } };

                    const event = this.delegate.notifyApplicationCustomEvent(dispatched.event, {
                        ...(dispatched.detail || {}),
                        context: this.context,
                        promise: { resolve, reject }
                    });

                    if (event?.defaultPrevented) {
                        defaultPrevented = true;
                    }
                });
            }
            else {
                const event = this.delegate.notifyApplicationCustomEvent(dispatched.event, {
                    ...(dispatched.detail || {}),
                    context: this.context
                });

                if (event?.defaultPrevented) defaultPrevented = true;
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

        if (oc.useTurbo && oc.useTurbo()) {
            oc.visit(href);
        }
        else {
            location.assign(href);
        }
    }

    // Mark known elements as being updated
    markAsUpdating(isUpdating) {
        var updateOptions = this.options.update || {};

        for (var partial in updateOptions) {
            let selector = updateOptions[partial];
            let selectedEl = [];

            if (updateOptions['_self'] && partial == this.options.partial && this.delegate.partialEl) {
                selector = updateOptions['_self'];
                selectedEl = [this.delegate.partialEl];
            }
            else {
                selectedEl = resolveSelectorResponse(selector, '[data-ajax-partial="'+partial+'"]');
            }

            selectedEl.forEach(function(el) {
                if (isUpdating) {
                    el.setAttribute('data-ajax-updating', '');
                }
                else {
                    el.removeAttribute('data-ajax-updating');
                }
            });
        }
    }

    async handleUpdateResponse(data, responseCode, xhr) {
        if (!data.$env) {
            return;
        }

        const
            updateOptions = this.options.update || {},
            domPatcher = new DomPatcher(data.$env, updateOptions, {
                partial: this.options.partial,
                partialEl: this.delegate.partialEl
            });

        domPatcher.afterUpdate((el) => {
            this.delegate.notifyApplicationAjaxUpdate(el, data, responseCode, xhr);
        });

        domPatcher.apply();

        // Wait for the dom patcher to finish rendering from partial updates
        setTimeout(() => {
            this.delegate.notifyApplicationUpdateComplete(data, responseCode, xhr);
            this.invoke('afterUpdate', [data, responseCode, xhr]);
            this.invokeFunc('afterUpdateFunc', data);
        }, 0);
    }

    async handleUpdateOperations(data, responseCode, xhr) {
        // Dispatch flash messages
        const flashMessages = this.delegate.options.flash ? data.$env?.getFlash() : null;
        if (flashMessages) {
            for (var flashMessage in flashMessages) {
                this.invoke('handleFlashMessage', [flashMessage.text, flashMessage.level]);
            }
        }

        // Handle browser events
        const browserEvents = data.$env?.getBrowserEvents();
        if (browserEvents && await this.invoke('handleBrowserEvents', [browserEvents])) {
            return;
        }

        // Handle redirect
        const redirectUrl = data.$env?.getRedirectUrl();
        if (redirectUrl) {
            this.delegate.toggleRedirect(redirectUrl);
        }

        if (this.delegate.isRedirect) {
            this.invoke('handleRedirectResponse', [this.delegate.options.redirect]);
        }

        // Handle validation
        const invalidFields = data.$env?.getInvalid();
        if (invalidFields) {
            this.invoke('handleValidationMessage', [data.$env?.getMessage(), invalidFields]);
        }

        // Handle asset injection
        const loadAssets = data.$env?.getAssets();
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

        const fileName = typeof this.options.download === 'string'
            ? this.options.download
            : getFilenameFromHttpResponse(xhr);

        if (!fileName) {
            return;
        }

        const anchor = document.createElement('a');
        anchor.href = window.URL.createObjectURL(data);
        anchor.download = fileName;
        anchor.target = '_blank';
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
                value.forEach(val => searchParams.append(`${key}[]`, val));
            }
            else if (value === null) {
                searchParams.delete(key);
                searchParams.delete(`${key}[]`);
            }
            else {
                searchParams.set(key, value);
            }
        }

        var newUrl = window.location.pathname,
            queryStr = searchParams.toString();

        if (queryStr) {
            newUrl += '?' + queryStr.replaceAll('%5B%5D=', '[]=')
        }

        if (oc.useTurbo && oc.useTurbo()) {
            oc.visit(newUrl, { action: 'swap', scroll: false });
        }
        else {
            history.replaceState(null, '', newUrl);

            // Tracking referrer since document.referrer will not update
            localStorage.setItem('ocPushStateReferrer', newUrl);
        }
    }
}

function getFilenameFromHttpResponse(xhr) {
    const contentDisposition = xhr.getResponseHeader('Content-Disposition');
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
        // Decide ASCII or UTF-8 file name
        return (/filename[^;*=\n]*\*=[^']*''/.exec(match[0]) === null)
            ? match[1].replace(/['"]/g, '')
            : decodeURIComponent(match[1].substring(match[1].indexOf("''") + 2));
    }

    return null;
}
