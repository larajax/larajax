import Request from "../request/namespace";
import { JsonParser } from "../util/json-parser";

export class RequestBuilder
{
    constructor(element, handler, options) {
        this.options = options || {};
        this.ogElement = element;
        this.element = this.findElement(element);

        if (!this.element) {
            return Request.send(handler, this.options);
        }

        this.assignAsEval('beforeUpdateFunc', 'requestBeforeUpdate');
        this.assignAsEval('afterUpdateFunc', 'requestAfterUpdate');
        this.assignAsEval('successFunc', 'requestSuccess');
        this.assignAsEval('errorFunc', 'requestError');
        this.assignAsEval('cancelFunc', 'requestCancel');
        this.assignAsEval('completeFunc', 'requestComplete');

        this.assignAsData('progressBar', 'requestProgressBar');
        this.assignAsData('message', 'requestMessage');
        this.assignAsData('confirm', 'requestConfirm');
        this.assignAsData('redirect', 'requestRedirect');
        this.assignAsData('loading', 'requestLoading');
        this.assignAsData('form', 'requestForm');
        this.assignAsData('url', 'requestUrl');
        this.assignAsData('bulk', 'requestBulk', { emptyAsTrue: true });
        this.assignAsData('files', 'requestFiles', { emptyAsTrue: true });
        this.assignAsData('flash', 'requestFlash', { emptyAsTrue: true });
        this.assignAsData('download', 'requestDownload', { emptyAsTrue: true });
        this.assignAsData('update', 'requestUpdate', { parseJson: true });
        this.assignAsData('query', 'requestQuery', { emptyAsTrue: true, parseJson: true });

        this.assignAsData('browserTarget', 'browserTarget');
        this.assignAsData('browserValidate', 'browserValidate', { emptyAsTrue: true });
        this.assignAsData('browserRedirectBack', 'browserRedirectBack', { emptyAsTrue: true });

        this.assignAsMetaData('update', 'ajaxRequestUpdate', { parseJson: true, mergeValue: true });

        this.assignRequestData();

        if (!handler) {
            handler = this.getHandlerName();
        }

        return Request.sendElement(this.element, handler, this.options);
    }

    static fromElement(element, handler, options) {
        if (typeof element === 'string') {
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

        if (element.matches('[data-request]')) {
            return element;
        }

        var parentEl = element.closest('[data-request]');
        if (parentEl) {
            return parentEl;
        }

        return element;
    }

    getHandlerName() {
        if (this.element.dataset.dataRequest) {
            return this.element.dataset.dataRequest;
        }

        return this.element.getAttribute('data-request');
    }

    assignAsEval(optionName, name) {
        if (this.options[optionName] !== undefined) {
            return;
        }

        var attrVal;
        if (this.element.dataset[name]) {
            attrVal = this.element.dataset[name];
        }
        else {
            attrVal = this.element.getAttribute('data-' + normalizeDataKey(name));
        }

        if (!attrVal) {
            return;
        }

        this.options[optionName] = function(element, data) {
            return (new Function('data', attrVal)).apply(element, [data]);
        };
    }

    assignAsData(optionName, name, { parseJson = false, emptyAsTrue = false } = {}) {
        if (this.options[optionName] !== undefined) {
            return;
        }

        var attrVal;
        if (this.element.dataset[name]) {
            attrVal = this.element.dataset[name];
        }
        else {
            attrVal = this.element.getAttribute('data-' + normalizeDataKey(name));
        }

        if (attrVal === null) {
            return;
        }

        attrVal = this.castAttrToOption(attrVal, emptyAsTrue);

        if (parseJson && typeof attrVal === 'string') {
            attrVal = JsonParser.paramToObj(
                'data-' + normalizeDataKey(name),
                attrVal
            );
        }

        this.options[optionName] = attrVal;
    }

    assignAsMetaData(optionName, name, { mergeValue = true, parseJson = false, emptyAsTrue = false } = {}) {
        const meta = document.documentElement.querySelector('head meta[name="'+normalizeDataKey(name)+'"]');
        if (!meta) {
            return;
        }

        var attrVal = meta.getAttribute('content');

        if (parseJson) {
            attrVal = JsonParser.paramToObj(normalizeDataKey(name), attrVal);
        }
        else {
            attrVal = this.castAttrToOption(attrVal, emptyAsTrue);
        }

        if (mergeValue) {
            this.options[optionName] = {
                ...(this.options[optionName] || {}),
                ...attrVal
            }
        }
        else {
            this.options[optionName] = attrVal;
        }
    }

    castAttrToOption(val, emptyAsTrue) {
        if (emptyAsTrue && val === '') {
            return true;
        }

        if (val === 'true' || val === '1') {
            return true;
        }

        if (val === 'false' || val === '0') {
            return false;
        }

        return val;
    }

    assignRequestData() {
        const data = {};
        if (this.options.data) {
            Object.assign(data, this.options.data);
        }

        const attr = this.ogElement.getAttribute('data-request-data');
        if (attr) {
            Object.assign(data, JsonParser.paramToObj('data-request-data', attr));
        }

        elementParents(this.ogElement, '[data-request-data]').reverse().forEach(function(el) {
            Object.assign(data, JsonParser.paramToObj(
                'data-request-data',
                el.getAttribute('data-request-data')
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
    return key.replace(/[A-Z]/g, chr => `-${chr.toLowerCase()}`)
}
