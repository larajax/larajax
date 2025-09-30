import { HeadDetails } from "./head-details";
import { Location } from "./location";
import { array } from "../util";

export class Snapshot
{
    constructor(headDetails, bodyElement) {
        this.headDetails = headDetails;
        this.bodyElement = bodyElement;
    }

    static wrap(value) {
        if (value instanceof this) {
            return value;
        }
        else if (typeof value == 'string') {
            return this.fromHTMLString(value);
        }
        else {
            return this.fromHTMLElement(value);
        }
    }

    static fromHTMLString(html) {
        const element = document.createElement('html');
        element.innerHTML = html;
        return this.fromHTMLElement(element);
    }

    static fromHTMLElement(htmlElement) {
        const headElement = htmlElement.querySelector('head');
        const bodyElement = htmlElement.querySelector('body') || document.createElement('body');
        const headDetails = HeadDetails.fromHeadElement(headElement);
        return new this(headDetails, bodyElement);
    }

    clone() {
        return new Snapshot(this.headDetails, this.bodyElement.cloneNode(true));
    }

    getRootLocation() {
        const root = this.getSetting('root', '/');
        return new Location(root);
    }

    getCacheControlValue() {
        return this.getSetting('cache-control');
    }

    getElementForAnchor(anchor) {
        try {
            return this.bodyElement.querySelector(`[id='${anchor}'], a[name='${anchor}']`);
        }
        catch (e) {
            return null;
        }
    }

    getPermanentElements() {
        return array(this.bodyElement.querySelectorAll('[id][data-turbo-permanent]'));
    }

    getPermanentElementById(id) {
        return this.bodyElement.querySelector(`#${id}[data-turbo-permanent]`);
    }

    getPermanentElementsPresentInSnapshot(snapshot) {
        return this.getPermanentElements().filter(({ id }) => snapshot.getPermanentElementById(id));
    }

    findFirstAutofocusableElement() {
        return this.bodyElement.querySelector('[autofocus]');
    }

    hasAnchor(anchor) {
        return this.getElementForAnchor(anchor) != null;
    }

    isPreviewable() {
        return this.getCacheControlValue() != 'no-preview';
    }

    isCacheable() {
        return this.getCacheControlValue() != 'no-cache';
    }

    isNativeError() {
        return this.getSetting('visit-control', false) != false;
    }

    isEnabled() {
        return this.getSetting('visit-control') != 'disable';
    }

    isVisitable() {
        return this.isEnabled() && this.getSetting('visit-control') != 'reload';
    }

    getSetting(name, defaultValue) {
        const value = this.headDetails.getMetaValue(`turbo-${name}`);
        return value == null ? defaultValue : value;
    }
}
