import { Renderer } from "./renderer";
import { array } from "../util";

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
            this.delegate.pageIsReady = false;
            this.countNewBodyModuleScripts();
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
        for (const element of this.getNewHeadScriptElements()) {
            document.head.appendChild(
                this.bindPendingAssetLoadedEventOnce(
                    this.createScriptElement(element)
                )
            );
        }
    }

    bindPendingAssetLoadedEventOnce(element) {
        if (!element.hasAttribute('src')) {
            return element;
        }

        this.delegate.incrementPendingAsset();
        return this.settlePendingAssetOnLoadOnce(element);
    }

    settlePendingAssetOnLoadOnce(element) {
        var self = this,
            settleEvent = function() {
                self.delegate.decrementPendingAsset();
                element.removeEventListener('load', settleEvent);
                element.removeEventListener('error', settleEvent);
            };

        element.addEventListener('load', settleEvent);
        element.addEventListener('error', settleEvent);
        return element;
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
            if (isPendingModuleScript(inertScriptElement)) {
                this.settlePendingModuleScriptOnce(activatedScriptElement);
            }
            replaceElementWithElement(inertScriptElement, activatedScriptElement);
        }
    }

    // The browser ignores the text of a script with a src, so external modules
    // settle on load instead, which still fires when the module is already cached
    settlePendingModuleScriptOnce(element) {
        if (element.hasAttribute('src')) {
            this.settlePendingAssetOnLoadOnce(element);
        }
        else {
            element.textContent += "\n" + "dispatchEvent(new CustomEvent('turbo:module-loaded'));";
        }
    }

    countNewBodyModuleScripts() {
        for (const element of this.getNewBodyScriptElements()) {
            if (isPendingModuleScript(element)) {
                this.delegate.incrementPendingAsset();
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

function isPendingModuleScript(element) {
    return element.getAttribute('type') === 'module' &&
        element.getAttribute('data-turbo-eval') !== 'false';
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
