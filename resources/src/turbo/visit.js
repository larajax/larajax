import { HttpRequest } from "../util/http-request";
import { Location } from "./location";
import { Snapshot } from "./snapshot";
import { uuid } from "../util";

export var TimingMetric = {
    visitStart: 'visitStart',
    requestStart: 'requestStart',
    requestEnd: 'requestEnd',
    visitEnd: 'visitEnd'
};

export var VisitState = {
    initialized: 'initialized',
    started: 'started',
    canceled: 'canceled',
    failed: 'failed',
    completed: 'completed'
};

export class Visit
{
    constructor(controller, location, action, restorationIdentifier = uuid()) {
        this.identifier = uuid();
        this.timingMetrics = {};
        this.followedRedirect = false;
        this.historyChanged = false;
        this.progress = 0;
        this.scrolled = false;
        this.snapshotCached = action === 'swap';
        this.state = VisitState.initialized;

        // Scrolling
        this.performScroll = () => {
            if (!this.scrolled) {
                if (this.action == 'restore') {
                    this.scrollToRestoredPosition() || this.scrollToTop();
                }
                else {
                    this.scrollToAnchor() || this.scrollToTop();
                }
                this.scrolled = true;
            }
        };

        this.controller = controller;
        this.location = location;
        this.action = action;
        this.adapter = controller.adapter;
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
            const actionForHistory = this.location.isEqualTo(this.referrer) ? 'replace' : this.action;
            const method = this.getHistoryMethodForAction(actionForHistory);
            method.call(this.controller, this.location, this.restorationIdentifier);
            this.historyChanged = true;
        }
    }

    issueRequest() {
        if (this.shouldIssueRequest() && !this.request) {
            const url = Location.wrap(this.location).absoluteURL;
            const options = {
                method: 'GET',
                headers: {},
                htmlOnly: true,
                timeout: 240
            };

            options.headers['Accept'] = 'text/html, application/xhtml+xml';
            options.headers['X-PJAX'] = 1;

            if (this.hasCachedSnapshot()) {
                options.headers['X-PJAX-CACHED'] = 1;
            }

            if (this.referrer) {
                options.headers['X-PJAX-REFERRER'] = Location.wrap(this.referrer).absoluteURL;
            }

            this.progress = 0;
            this.request = new HttpRequest(this, url, options);
            this.request.send();
        }
    }

    getCachedSnapshot() {
        const snapshot = this.controller.getCachedSnapshotForLocation(this.location);
        if (snapshot && (!this.location.anchor || snapshot.hasAnchor(this.location.anchor))) {
            if (this.action == 'restore' || snapshot.isPreviewable()) {
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
                }
                else {
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
                }
                else {
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
        const position = this.restorationData ? this.restorationData.scrollPosition : undefined;
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
        this.timingMetrics[metric] = new Date().getTime();
    }

    getTimingMetrics() {
        return Object.assign({}, this.timingMetrics);
    }

    // Private
    getHistoryMethodForAction(action) {
        switch (action) {
            case 'swap':
            case 'replace':
                return this.controller.replaceHistoryWithLocationAndRestorationIdentifier;

            case 'advance':
            case 'restore':
                return this.controller.pushHistoryWithLocationAndRestorationIdentifier;
        }
    }

    shouldIssueRequest() {
        if (this.action == 'restore') {
            return !this.hasCachedSnapshot();
        }
        else if (this.isSamePage) {
            return false;
        }
        else {
            return true;
        }
    }

    locationChangeIsSamePage() {
        if (this.action == 'swap') {
            return true;
        }

        const lastLocation = this.action == 'restore' && this.controller.lastRenderedLocation;
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
