import { Envelope } from "./envelope";
import { Options } from "./options";
import { Actions } from "./actions";
import { Data } from "./data";
import { HttpRequest, SystemStatusCode } from "../util/http-request";
import { Deferred } from "../util/deferred";
import { ProgressBar } from "../extras/progress-bar";
import { dispatch } from "../util";
import { cancellablePromise } from "../util/promise";

export class Request
{
    constructor(element, handler, options) {
        this.el = element;
        this.handler = handler;
        this.options = { ...this.constructor.DEFAULTS, ...(options || {}) };
        this.context = { el: element, handler: handler, options: this.options };

        this.progressBar = new ProgressBar;
        this.showProgressBar = () => {
            this.progressBar.show({ cssClass: 'is-ajax' });
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
        }
    }

    start() {
        // Setup
        if (!this.applicationAllowsSetup()) {
            return;
        }

        this.initOtherElements();
        this.preprocessOptions();

        // Prepare actions
        this.actions = new Actions(this, this.context, this.options);
        if (!this.validateClientSideForm() || !this.applicationAllowsRequest()) {
            return;
        }

        // Confirm before sending
        if (this.options.confirm && !this.actions.invoke('handleConfirmMessage', [this.options.confirm])) {
            return;
        }

        // Send request
        this.sendInternal();

        return this.promise;
    }

    sendInternal() {
        // Prepare data
        const dataObj = new Data(this.options.data, this.el, this.formEl);
        let data;
        if (this.options.files) {
            data = dataObj.getAsFormData();
        }
        else if (this.options.bulk) {
            data = dataObj.getAsJsonData();
        }
        else {
            data = dataObj.getAsQueryString();
        }

        // Prepare query
        if (this.options.query) {
            this.actions.invoke('applyQueryToUrl', [
                this.options.query !== true
                    ? this.options.query
                    : JSON.parse(dataObj.getAsJsonData())
            ]);
        }

        // Prepare request
        const { url, headers, method, responseType } = Options.fetch(this.handler, this.options);
        this.request = new HttpRequest(this, url, { method, headers, responseType, data, trackAbort: true });
        this.promise = cancellablePromise();
        this.isRedirect = this.options.redirect && this.options.redirect.length > 0;

        // Lifecycle events
        this.notifyApplicationBeforeSend();
        this.notifyApplicationAjaxPromise();

        this.promise
            .onCancel(() => {
                this.request.abort();
            })
            .then(data => {
                if (!this.isRedirect) {
                    this.notifyApplicationAjaxDone(data, data.$status, data.$xhr);
                    this.notifyApplicationAjaxAlways(data, data.$status, data.$xhr);
                }
            })
            .catch(data => {
                if (!this.isRedirect) {
                    this.notifyApplicationAjaxFail(data, data.$status, data.$xhr);
                    this.notifyApplicationAjaxAlways(data, data.$status, data.$xhr);
                }
            })
        ;

        this.request.send();
    }

    static send(handler, options) {
        return (new Request(document, handler, options)).start();
    }

    static sendElement(element, handler, options) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        return (new Request(element, handler, options)).start();
    }

    toggleRedirect(redirectUrl) {
        if (!redirectUrl) {
            this.options.redirect = null;
            this.isRedirect = false;
        }
        else {
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
        return dispatch('ajax:setup', { target: this.el, detail: { context: this.context } });
    }

    notifyApplicationAjaxPromise() {
        return dispatch('ajax:promise', { target: this.el, detail: { context: this.context } });
    }

    notifyApplicationAjaxFail(data, responseCode, xhr) {
        return dispatch('ajax:fail', { target: this.el, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationAjaxDone(data, responseCode, xhr) {
        return dispatch('ajax:done', { target: this.el, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationAjaxAlways(data, responseCode, xhr) {
        return dispatch('ajax:always', { target: this.el, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationAjaxUpdate(target, data, responseCode, xhr) {
        return dispatch('ajax:update', { target, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationBeforeRedirect() {
        return dispatch('ajax:before-redirect', { target: this.el });
    }

    notifyApplicationBeforeRequest() {
        return dispatch('ajax:before-request', { target: this.triggerEl, detail: { context: this.context } });
    }

    notifyApplicationBeforeUpdate(data, responseCode, xhr) {
        return dispatch('ajax:before-update', { target: this.triggerEl, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationRequestSuccess(data, responseCode, xhr) {
        return dispatch('ajax:request-success', { target: this.triggerEl, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationRequestError(message, responseCode, xhr) {
        return dispatch('ajax:request-error', { target: this.triggerEl, detail: { context: this.context, message, responseCode, xhr } });
    }

    notifyApplicationRequestComplete(data, responseCode, xhr) {
        return dispatch('ajax:request-complete', { target: this.triggerEl, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationBeforeValidate(message, fields) {
        return dispatch('ajax:before-validate', { target: this.triggerEl, detail: { context: this.context, message, fields } });
    }

    notifyApplicationBeforeReplace(target) {
        return dispatch('ajax:before-replace', { target });
    }

    // Window-based events
    notifyApplicationBeforeSend() {
        return dispatch('ajax:before-send', { target: window, detail: { context: this.context } });
    }

    notifyApplicationUpdateComplete(data, responseCode, xhr) {
        return dispatch('ajax:update-complete', { target: window, detail: { context: this.context, data, responseCode, xhr } });
    }

    notifyApplicationFieldInvalid(element, fieldName, errorMsg, isFirst) {
        return dispatch('ajax:invalid-field', { target: window, detail: { element, fieldName, errorMsg, isFirst } });
    }

    notifyApplicationConfirmMessage(message, promise) {
        return dispatch('ajax:confirm-message', { target: window, detail: { message, promise } });
    }

    notifyApplicationErrorMessage(message) {
        return dispatch('ajax:error-message', { target: window, detail: { message } });
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

        this.actions.invoke('start', [this.request.xhr]);
    }

    requestProgressed(progress) {
    }

    async requestCompletedWithResponse(response, statusCode) {
        const data = decorateResponse(response, statusCode, this.request.xhr);
        await this.actions.invoke('success', [data, statusCode, this.request.xhr]);
        await this.actions.invoke('complete', [data, statusCode, this.request.xhr]);
        this.promise.resolve(data);
    }

    async requestFailedWithStatusCode(statusCode, response) {
        const data = decorateResponse(response, statusCode, this.request.xhr);
        if (statusCode == SystemStatusCode.userAborted) {
            await this.actions.invoke('cancel', []);
        }
        else {
            await this.actions.invoke('error', [data, statusCode, this.request.xhr]);
        }

        await this.actions.invoke('complete', [data, statusCode, this.request.xhr]);
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
        if (typeof this.options.form === 'string') {
            this.formEl = document.querySelector(this.options.form);
        }
        else if (this.options.form) {
            this.formEl = this.options.form;
        }
        else {
            this.formEl = this.el && this.el !== document ? this.el.closest('form') : null;
        }

        this.triggerEl = this.formEl ? this.formEl : this.el;

        this.partialEl = this.el && this.el !== document ? this.el.closest('[data-ajax-partial]') : null;

        this.loadingEl = typeof this.options.loading === 'string'
            ? document.querySelector(this.options.loading)
            : this.options.loading;
    }

    preprocessOptions() {
        // Partial mode
        if (this.options.partial === undefined && this.partialEl && this.partialEl.dataset.ajaxPartial !== undefined) {
            this.options.partial = this.partialEl.dataset.ajaxPartial || true;
        }
    }

    validateClientSideForm() {
        if (
            this.options.browserValidate &&
            typeof document.createElement('input').reportValidity === 'function' &&
            this.formEl &&
            !this.formEl.checkValidity()
        ) {
            this.formEl.reportValidity();
            return false;
        }

        return true;
    }

    toggleLoadingElement(isLoading) {
        if (!this.loadingEl) {
            return;
        }

        if (
            typeof this.loadingEl.show !== 'function' ||
            typeof this.loadingEl.hide !== 'function'
        ) {
            this.loadingEl.style.display = isLoading ? 'block' : 'none';
            return;
        }

        if (isLoading) {
            this.loadingEl.show();
        }
        else {
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
            document.documentElement.setAttribute('data-ajax-progress', '');
            if (this.formEl) {
                this.formEl.setAttribute('data-ajax-progress', this.handler);
            }
        }
        else {
            document.documentElement.removeAttribute('data-ajax-progress');
            if (this.formEl) {
                this.formEl.removeAttribute('data-ajax-progress');
            }
        }
    }
}

function decorateResponse(response, statusCode, xhr) {
    if (!response || response.constructor !== {}.constructor || !response.__ajax) {
        return response;
    }

    const
        { __ajax, ...data } = response,
        envelope = new Envelope(response, statusCode),
        meta = {
            env: envelope,
            status: statusCode,
            xhr: xhr
        };

    // Add each meta key as non-enumerable property prefixed with $
    for (const [key, value] of Object.entries(meta)) {
        Object.defineProperty(data, `$${key}`, {
            value,
            enumerable: false,
            writable: false,
            configurable: true,
        });
    }

    return data;
}
