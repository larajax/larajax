import { Renderer } from "./renderer";
import { array, uuid } from "../util";

export class PageRenderer extends Renderer
{
    constructor(delegate, currentPage, newPage) {
        super();
        this.delegate = delegate;
        this.currentPage = currentPage;
        this.currentHeadDetails = currentPage.headDetails;
        this.newPage = newPage;
        this.newHeadDetails = newPage.headDetails;
        this.newBody = newPage.bodyElement;
    }

    static render(delegate, callback, currentPage, newPage) {
        return new this(delegate, currentPage, newPage).render(callback);
    }

    render(callback) {
        if (this.shouldRender()) {
            this.delegate.beginPendingAssets();
            this.mergeHead();
            this.renderView(() => {
                this.replaceBody();
                this.focusFirstAutofocusableElement();
                callback();
            });
        }
        else {
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
        return this.currentPage.isEnabled() && this.newPage.isVisitable() && this.trackedElementsAreIdentical();
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
        for (const inertScriptElement of this.getNewHeadScriptElements()) {
            const activatedScriptElement = this.createScriptElement(inertScriptElement);
            document.head.appendChild(activatedScriptElement);
            if (activatedScriptElement !== inertScriptElement) {
                this.bindPendingScriptElement(activatedScriptElement);
            }
        }
    }

    // Holds page:loaded until the script has run, for each script a full page
    // load would run before DOMContentLoaded
    bindPendingScriptElement(element) {
        if (!isPendingScript(element)) {
            return;
        }

        const settle = this.delegate.trackPendingAsset();
        if (element.hasAttribute('src')) {
            settleOnLoadOnce(element, settle);
        }
        else {
            insertModuleLoadedSignal(element, settle);
        }
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
            const newElement = this.newPage.getPermanentElementById(permanentElement.id);
            if (newElement) {
                const placeholder = createPlaceholderForPermanentElement(permanentElement);
                replaceElementWithElement(permanentElement, placeholder.element);
                replaceElementWithElement(newElement, permanentElement);
                return [...placeholders, placeholder];
            }
            else {
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
            if (activatedScriptElement !== inertScriptElement) {
                replaceElementWithElement(inertScriptElement, activatedScriptElement);
                this.bindPendingScriptElement(activatedScriptElement);
            }
        }
    }

    assignNewBody() {
        replaceElementWithElement(document.body, this.newBody);
    }

    focusFirstAutofocusableElement() {
        const element = this.newPage.findFirstAutofocusableElement();
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
        return this.currentPage.getPermanentElementsPresentInPage(this.newPage);
    }

    getNewBodyScriptElements() {
        return array(this.newBody.querySelectorAll('script'));
    }
}

// Modules and external classic scripts, unless async, since DOMContentLoaded
// doesn't wait for those either
function isPendingScript(element) {
    const type = (element.getAttribute('type') || '').trim().toLowerCase();
    if (element.hasAttribute('async')) {
        return false;
    }

    if (type === 'module') {
        return true;
    }

    return element.hasAttribute('src') &&
        !element.hasAttribute('nomodule') &&
        (type === '' || /^(text|application)\/(x-)?(java|ecma)script$/.test(type));
}

// Load fires even when the browser reuses a module it has already evaluated
function settleOnLoadOnce(element, settle) {
    const settleEvent = () => {
        element.removeEventListener('load', settleEvent);
        element.removeEventListener('error', settleEvent);
        settle();
    };

    element.addEventListener('load', settleEvent);
    element.addEventListener('error', settleEvent);
}

// Inline modules fire no load event, so a separate module signals instead. It runs
// after this one even when this one throws, and like DOMContentLoaded it doesn't
// wait for top-level await to finish
function insertModuleLoadedSignal(element, settle) {
    const id = uuid();
    const signalElement = document.createElement('script');
    const settleEvent = (event) => {
        if (event.detail === id) {
            removeEventListener('turbo:module-loaded', settleEvent);
            signalElement.remove();
            settle();
        }
    };

    signalElement.setAttribute('type', 'module');
    signalElement.async = false;
    if (element.nonce) {
        signalElement.nonce = element.nonce;
    }
    signalElement.textContent = "dispatchEvent(new CustomEvent('turbo:module-loaded', { detail: '" + id + "' }));";

    addEventListener('turbo:module-loaded', settleEvent);
    element.parentNode.insertBefore(signalElement, element.nextSibling);
}

function createPlaceholderForPermanentElement(permanentElement) {
    const element = document.createElement('meta');
    element.setAttribute('name', 'turbo-permanent-placeholder');
    element.setAttribute('content', permanentElement.id);
    return { element, permanentElement };
}

function replaceElementWithElement(fromElement, toElement) {
    const parentElement = fromElement.parentElement;
    if (parentElement) {
        return parentElement.replaceChild(toElement, fromElement);
    }
}

function elementIsFocusable(element) {
    return element && typeof element.focus == 'function';
}
