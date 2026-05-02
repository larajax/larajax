import { describe, it, expect, mock, beforeEach } from 'bun:test';

mock.module('../../src/util/http-request', () => ({
    HttpRequest: class {
        constructor() {}
        send() {}
        abort() {}
    }
}));

import { Visit, VisitState, TimingMetric } from '../../src/turbo/visit';
import { Location } from '../../src/turbo/location';

function createMockController(overrides = {}) {
    return {
        adapter: {
            visitStarted: () => {},
            visitCompleted: () => {},
            visitFailed: () => {},
            visitRendered: () => {},
            visitRequestStarted: () => {},
            visitRequestCompleted: () => {},
            visitRequestFinished: () => {},
            visitRequestFailedWithStatusCode: () => {},
            visitRequestProgressed: () => {},
        },
        visitCompleted: () => {},
        location: new Location('http://localhost/current'),
        locationIsSamePageAnchor: () => false,
        lastRenderedLocation: null,
        scrollToPosition: () => {},
        scrollToAnchor: () => {},
        pushHistoryWithLocationAndRestorationIdentifier: () => {},
        replaceHistoryWithLocationAndRestorationIdentifier: () => {},
        render: (options, callback) => { callback(); },
        ...overrides
    };
}

describe('Visit', () => {
    let controller;
    let location;

    beforeEach(() => {
        controller = createMockController();
        location = new Location('http://localhost/new-page');
    });

    describe('state machine', () => {
        it('starts in initialized state', () => {
            const visit = new Visit(controller, location, 'advance');
            expect(visit.state).toBe(VisitState.initialized);
        });

        it('start() transitions to started state', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            expect(visit.state).toBe(VisitState.started);
        });

        it('start() calls adapter.visitStarted', () => {
            let called = false;
            controller.adapter.visitStarted = () => { called = true; };
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            expect(called).toBe(true);
        });

        it('start() records visitStart timing metric', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            expect(visit.timingMetrics[TimingMetric.visitStart]).toBeDefined();
            expect(typeof visit.timingMetrics[TimingMetric.visitStart]).toBe('number');
        });

        it('start() does nothing if not in initialized state', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.cancel();
            const state = visit.state;
            visit.start(); // should be no-op
            expect(visit.state).toBe(state);
        });

        it('cancel() transitions from started to canceled', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.cancel();
            expect(visit.state).toBe(VisitState.canceled);
        });

        it('cancel() does nothing if not started', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.cancel();
            expect(visit.state).toBe(VisitState.initialized);
        });

        it('complete() transitions from started to completed', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.complete();
            expect(visit.state).toBe(VisitState.completed);
        });

        it('complete() records visitEnd timing metric', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.complete();
            expect(visit.timingMetrics[TimingMetric.visitEnd]).toBeDefined();
        });

        it('complete() calls controller.visitCompleted', () => {
            let called = false;
            controller.visitCompleted = () => { called = true; };
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.complete();
            expect(called).toBe(true);
        });

        it('complete() calls adapter.visitCompleted', () => {
            let called = false;
            controller.adapter.visitCompleted = () => { called = true; };
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.complete();
            expect(called).toBe(true);
        });

        it('fail() transitions from started to failed', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.fail();
            expect(visit.state).toBe(VisitState.failed);
        });

        it('fail() calls adapter.visitFailed', () => {
            let called = false;
            controller.adapter.visitFailed = () => { called = true; };
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            visit.fail();
            expect(called).toBe(true);
        });
    });

    describe('scroll behavior', () => {
        it('scrolls to top for advance action', () => {
            let scrollPosition = null;
            controller.scrollToPosition = (pos) => { scrollPosition = pos; };
            const visit = new Visit(controller, location, 'advance');
            visit.performScroll();
            expect(scrollPosition).toEqual({ x: 0, y: 0 });
        });

        it('scrolls to restored position for restore action', () => {
            let scrollPosition = null;
            controller.scrollToPosition = (pos) => { scrollPosition = pos; };
            const visit = new Visit(controller, location, 'restore');
            visit.restorationData = { scrollPosition: { x: 0, y: 500 } };
            visit.performScroll();
            expect(scrollPosition).toEqual({ x: 0, y: 500 });
        });

        it('scrolls to top when no restored position for restore action', () => {
            let scrollPosition = null;
            controller.scrollToPosition = (pos) => { scrollPosition = pos; };
            const visit = new Visit(controller, location, 'restore');
            visit.restorationData = {};
            visit.performScroll();
            expect(scrollPosition).toEqual({ x: 0, y: 0 });
        });

        it('scrolls to anchor when location has anchor', () => {
            let anchorUsed = null;
            controller.scrollToAnchor = (anchor) => { anchorUsed = anchor; };
            const anchorLocation = new Location('http://localhost/page#section');
            const visit = new Visit(controller, anchorLocation, 'advance');
            visit.performScroll();
            expect(anchorUsed).toBe('section');
        });

        it('only scrolls once (scrolled flag)', () => {
            let scrollCount = 0;
            controller.scrollToPosition = () => { scrollCount++; };
            const visit = new Visit(controller, location, 'advance');
            visit.performScroll();
            visit.performScroll();
            visit.performScroll();
            expect(scrollCount).toBe(1);
        });
    });

    describe('history', () => {
        it('changeHistory calls pushHistory for advance action', () => {
            let pushed = false;
            controller.pushHistoryWithLocationAndRestorationIdentifier = () => { pushed = true; };
            const visit = new Visit(controller, location, 'advance');
            visit.referrer = new Location('http://localhost/old');
            visit.changeHistory();
            expect(pushed).toBe(true);
        });

        it('changeHistory calls replaceHistory for replace action', () => {
            let replaced = false;
            controller.replaceHistoryWithLocationAndRestorationIdentifier = () => { replaced = true; };
            const visit = new Visit(controller, location, 'replace');
            visit.referrer = new Location('http://localhost/old');
            visit.changeHistory();
            expect(replaced).toBe(true);
        });

        it('changeHistory calls replaceHistory when location equals referrer', () => {
            let replaced = false;
            controller.replaceHistoryWithLocationAndRestorationIdentifier = () => { replaced = true; };
            const sameLocation = new Location('http://localhost/same');
            const visit = new Visit(controller, sameLocation, 'advance');
            visit.referrer = new Location('http://localhost/same');
            visit.changeHistory();
            expect(replaced).toBe(true);
        });

        it('changeHistory is idempotent', () => {
            let callCount = 0;
            controller.pushHistoryWithLocationAndRestorationIdentifier = () => { callCount++; };
            const visit = new Visit(controller, location, 'advance');
            visit.referrer = new Location('http://localhost/old');
            visit.changeHistory();
            visit.changeHistory();
            expect(callCount).toBe(1);
        });
    });

    describe('timing metrics', () => {
        it('getTimingMetrics returns a copy of metrics', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.start();
            const metrics = visit.getTimingMetrics();
            expect(metrics).not.toBe(visit.timingMetrics);
            expect(metrics[TimingMetric.visitStart]).toBe(visit.timingMetrics[TimingMetric.visitStart]);
        });
    });

    describe('request delegation', () => {
        it('requestStarted records timing and notifies adapter', () => {
            let notified = false;
            controller.adapter.visitRequestStarted = () => { notified = true; };
            const visit = new Visit(controller, location, 'advance');
            visit.requestStarted();
            expect(visit.timingMetrics[TimingMetric.requestStart]).toBeDefined();
            expect(notified).toBe(true);
        });

        it('requestFinished records timing and notifies adapter', () => {
            let notified = false;
            controller.adapter.visitRequestFinished = () => { notified = true; };
            const visit = new Visit(controller, location, 'advance');
            visit.requestFinished();
            expect(visit.timingMetrics[TimingMetric.requestEnd]).toBeDefined();
            expect(notified).toBe(true);
        });

        it('requestProgressed updates progress', () => {
            const visit = new Visit(controller, location, 'advance');
            visit.requestProgressed(0.5);
            expect(visit.progress).toBe(0.5);
        });
    });
});
