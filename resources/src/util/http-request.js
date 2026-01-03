import { Events } from "./events";

export var SystemStatusCode = {
    networkFailure: 0,
    timeoutFailure: -1,
    contentTypeMismatch: -2,
    userAborted: -3
}

export class HttpRequest
{
    constructor(delegate, url, options) {
        this.failed = false;
        this.progress = 0;
        this.sent = false;
        this.aborted = false;
        this.timedOut = false;

        this.delegate = delegate;
        this.url = url;
        this.options = options;

        this.headers = options.headers || {};
        this.method = options.method || 'GET';
        this.data = options.data;
        this.timeout = options.timeout || 0;

        // AbortController for cancellation and timeout
        this.controller = new AbortController();
        this.timeoutId = null;

        // XHR compatibility wrapper (populated after response)
        this.xhr = this.createXhrWrapper();
    }

    send() {
        if (this.sent) {
            return;
        }

        this.sent = true;
        this.notifyApplicationBeforeRequestStart();
        this.setProgress(0);
        this.delegate.requestStarted();

        // Set up timeout
        if (this.timeout > 0) {
            this.timeoutId = setTimeout(() => {
                this.timedOut = true;
                this.controller.abort();
            }, this.timeout * 1000);
        }

        this.performFetch();
    }

    async performFetch() {
        try {
            const response = await fetch(this.url, {
                method: this.method,
                headers: this.headers,
                body: this.data || null,
                signal: this.controller.signal
            });

            this.clearTimeout();

            // Update XHR wrapper with response data
            this.updateXhrWrapper(response);

            // Process the response
            await this.handleResponse(response);

        }
        catch (error) {
            this.clearTimeout();

            if (error.name === 'AbortError') {
                if (this.timedOut) {
                    this.handleTimeout();
                } else {
                    this.handleAbort();
                }
            } else {
                this.handleNetworkError();
            }
        }
    }

    async handleResponse(response) {
        const contentType = response.headers.get('Content-Type');
        const contentDisposition = response.headers.get('Content-Disposition') || '';

        // Check HTML-only constraint
        if (this.options.htmlOnly && !contentTypeIsHTML(contentType)) {
            this.failed = true;
            this.notifyApplicationAfterRequestEnd();
            this.delegate.requestFailedWithStatusCode(SystemStatusCode.contentTypeMismatch);
            this.destroy();
            return;
        }

        // Get response data based on content type
        let responseData;
        if (contentDisposition.startsWith('attachment') || contentDisposition.startsWith('inline')) {
            responseData = await response.blob();
        }
        else if (contentTypeIsJSON(contentType)) {
            responseData = await response.json();
        }
        else {
            responseData = await response.text();
        }

        // Check status code
        if (response.status >= 200 && response.status < 300) {
            this.notifyApplicationAfterRequestEnd();
            this.delegate.requestCompletedWithResponse(
                responseData,
                response.status,
                this.getRedirectLocation(response)
            );
            this.destroy();
        }
        else {
            this.failed = true;
            this.notifyApplicationAfterRequestEnd();
            this.delegate.requestFailedWithStatusCode(response.status, responseData);
            this.destroy();
        }
    }

    getRedirectLocation(response) {
        // Check for explicit redirect header
        const ajaxLocation = response.headers.get('X-AJAX-LOCATION');
        if (ajaxLocation) {
            return ajaxLocation;
        }

        // Check if response URL differs from request URL
        var anchorMatch = this.url.match(/^(.*)#/),
            wantUrl = anchorMatch ? anchorMatch[1] : this.url;

        return wantUrl !== response.url ? response.url : null;
    }

    handleTimeout() {
        this.failed = true;
        this.notifyApplicationAfterRequestEnd();
        this.delegate.requestFailedWithStatusCode(SystemStatusCode.timeoutFailure);
        this.destroy();
    }

    handleAbort() {
        if (this.options.trackAbort) {
            this.failed = true;
            this.notifyApplicationAfterRequestEnd();
            this.delegate.requestFailedWithStatusCode(SystemStatusCode.userAborted);
        } else {
            this.notifyApplicationAfterRequestEnd();
        }
        this.destroy();
    }

    handleNetworkError() {
        this.failed = true;
        this.notifyApplicationAfterRequestEnd();
        this.delegate.requestFailedWithStatusCode(SystemStatusCode.networkFailure);
        this.destroy();
    }

    abort() {
        if (this.sent && !this.aborted) {
            this.aborted = true;
            this.controller.abort();
        }
    }

    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    // Application events
    notifyApplicationBeforeRequestStart() {
        Events.dispatch('ajax:request-start', { detail: { url: this.url, xhr: this.xhr }, cancelable: false });
    }

    notifyApplicationAfterRequestEnd() {
        Events.dispatch('ajax:request-end', { detail: { url: this.url, xhr: this.xhr }, cancelable: false });
    }

    // XHR compatibility wrapper
    createXhrWrapper() {
        return {
            status: 0,
            statusText: '',
            responseURL: this.url,
            getResponseHeader: (name) => null,
            getAllResponseHeaders: () => ''
        };
    }

    updateXhrWrapper(response) {
        this.xhr = {
            status: response.status,
            statusText: response.statusText,
            responseURL: response.url,
            getResponseHeader: (name) => response.headers.get(name),
            getAllResponseHeaders: () => [...response.headers].map(([k, v]) => `${k}: ${v}`).join('\r\n')
        };
    }

    setProgress(progress) {
        this.progress = progress;
        this.delegate.requestProgressed(progress);
    }

    destroy() {
        this.setProgress(1);
        this.delegate.requestFinished();
    }
}

function contentTypeIsHTML(contentType) {
    return (contentType || '').match(/^text\/html|^application\/xhtml\+xml/);
}

function contentTypeIsJSON(contentType) {
    return (contentType || '').includes('application/json');
}
