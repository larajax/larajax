import { RequestBuilder } from '../core/request-builder';
import { JsonParser } from "../util/json-parser";

export class Migrate
{
    bind() {
        this.bindRequestFunc();
        this.bindRenderFunc();
        this.bindjQueryEvents();
    }

    bindRequestFunc() {
        var old = $.fn.request;

        $.fn.request = function(handler, option) {
            var options = typeof option === 'object' ? option : {};
            return new RequestBuilder(this.get(0), handler, options);
        }

        $.fn.request.Constructor = RequestBuilder;

        // Basic function
        $.request = function(handler, option) {
            return $(document).request(handler, option);
        }

        // No conflict
        $.fn.request.noConflict = function() {
            $.fn.request = old;
            return this;
        }
    }

    bindRenderFunc() {
        $.fn.render = function(callback) {
            $(document).on('render', callback);
        };
    }

    bindjQueryEvents() {
        // Element
        this.migratejQueryEvent(document, 'ajax:setup', 'ajaxSetup', ['context']);
        this.migratejQueryEvent(document, 'ajax:promise', 'ajaxPromise', ['context']);
        this.migratejQueryEvent(document, 'ajax:fail', 'ajaxFail', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:done', 'ajaxDone', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:always', 'ajaxAlways', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:before-redirect', 'ajaxRedirect');

        // Updated Element
        this.migratejQueryEvent(document, 'ajax:update', 'ajaxUpdate', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:before-replace', 'ajaxBeforeReplace');

        // Trigger Element
        this.migratejQueryEvent(document, 'ajax:before-request', 'oc.beforeRequest', ['context']);
        this.migratejQueryEvent(document, 'ajax:before-update', 'ajaxBeforeUpdate', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:request-success', 'ajaxSuccess', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:request-complete', 'ajaxComplete', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:request-error', 'ajaxError', ['context', 'message', 'responseCode', 'xhr']);
        this.migratejQueryEvent(document, 'ajax:before-validate', 'ajaxValidation', ['context', 'message', 'fields']);

        // Window
        this.migratejQueryEvent(window, 'ajax:before-send', 'ajaxBeforeSend', ['context']);
        this.migratejQueryEvent(window, 'ajax:update-complete', 'ajaxUpdateComplete', ['context', 'data', 'responseCode', 'xhr']);
        this.migratejQueryEvent(window, 'ajax:invalid-field', 'ajaxInvalidField', ['element', 'fieldName', 'errorMsg', 'isFirst']);
        this.migratejQueryEvent(window, 'ajax:confirm-message', 'ajaxConfirmMessage', ['message', 'promise']);
        this.migratejQueryEvent(window, 'ajax:error-message', 'ajaxErrorMessage', ['message']);

        // Data adapter
        this.migratejQueryAttachData(document, 'ajax:setup', 'a[data-request], button[data-request], form[data-request], a[data-handler], button[data-handler]');
    }

    // Private
    migratejQueryEvent(target, jsName, jqName, detailNames = []) {
        var self = this;
        $(target).on(jsName, function(ev) {
            self.triggerjQueryEvent(ev.originalEvent, jqName, detailNames);
        });
    }

    triggerjQueryEvent(ev, eventName, detailNames = []) {
        var jQueryEvent = $.Event(eventName),
            args = this.buildDetailArgs(ev, detailNames);

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
            var dataObj = $(this).data('request-data');
            if (!dataObj) {
                return;
            }

            var options = event.detail.context.options;
            if (dataObj.constructor === {}.constructor) {
                Object.assign(options.data, dataObj);
            }
            else if (typeof dataObj === 'string') {
                Object.assign(options.data, JsonParser.paramToObj('request-data', dataObj));
            }
        });
    }
}
