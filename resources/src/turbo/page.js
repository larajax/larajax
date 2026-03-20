import { HeadDetails } from "./head-details";
import { Location } from "./location";
import { array } from "../util";

export class Page
{
    constructor(headDetails, bodyElement) {
        this.headDetails = headDetails;
        this.bodyElement = bodyElement;
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

    getRootLocation() {
        const root = this.getSetting('root', '/');
        return new Location(root);
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

    getPermanentElementsPresentInPage(page) {
        return this.getPermanentElements().filter(({ id }) => page.getPermanentElementById(id));
    }

    findFirstAutofocusableElement() {
        return this.bodyElement.querySelector('[autofocus]');
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

    isViewTransitionEnabled() {
        return this.getSetting('view-transition') === 'same-origin';
    }

    getSetting(name, defaultValue) {
        const value = this.headDetails.getMetaValue(`turbo-${name}`);
        return value == null ? defaultValue : value;
    }
}