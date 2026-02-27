import { Renderer } from "./renderer";
import { array } from "../util";

export class SnapshotRenderer extends Renderer
{
    constructor(delegate, currentSnapshot, newSnapshot) {
        super();
        this.delegate = delegate;
        this.currentSnapshot = currentSnapshot;
        this.currentHeadDetails = currentSnapshot.headDetails;
        this.newSnapshot = newSnapshot;
        this.newHeadDetails = newSnapshot.headDetails;
        this.newBody = newSnapshot.bodyElement;
    }

    static render(delegate, callback, currentSnapshot, newSnapshot) {
        return new this(delegate, currentSnapshot, newSnapshot).render(callback);
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
        return this.currentSnapshot.isEnabled() && this.newSnapshot.isVisitable() && this.trackedElementsAreIdentical();
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

        var self = this,
            loadEvent = function() {
                self.delegate.decrementPendingAsset();
                element.removeEventListener('load', loadEvent);
            };

        element.addEventListener('load', loadEvent);
        this.delegate.incrementPendingAsset();
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
            const newElement = this.newSnapshot.getPermanentElementById(permanentElement.id);
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
            if (activatedScriptElement.getAttribute('type') === 'module') {
                activatedScriptElement.textContent += "\n" + "dispatchEvent(new CustomEvent('turbo:module-loaded'));";
            }
            replaceElementWithElement(inertScriptElement, activatedScriptElement);
        }
    }

    countNewBodyModuleScripts() {
        for (const element of this.getNewBodyScriptElements()) {
            if (element.getAttribute('type') === 'module') {
                this.delegate.incrementPendingAsset();
            }
        }
    }

    assignNewBody() {
        replaceElementWithElement(document.body, this.newBody);
    }

    focusFirstAutofocusableElement() {
        const element = this.newSnapshot.findFirstAutofocusableElement();
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
        return this.currentSnapshot.getPermanentElementsPresentInSnapshot(this.newSnapshot);
    }

    getNewBodyScriptElements() {
        return array(this.newBody.querySelectorAll('script'));
    }
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
