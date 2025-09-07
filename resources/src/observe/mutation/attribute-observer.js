import { ElementObserver } from "./element-observer";

export class AttributeObserver
{
    constructor(element, attributeName, delegate) {
        this.delegate = delegate;
        this.attributeName = attributeName;
        this.elementObserver = new ElementObserver(element, this);
    }

    get element() {
        return this.elementObserver.element;
    }

    get selector() {
        return `[${this.attributeName}]`;
    }

    start() {
        this.elementObserver.start();
    }

    pause(callback) {
        this.elementObserver.pause(callback);
    }

    stop() {
        this.elementObserver.stop();
    }

    refresh() {
        this.elementObserver.refresh();
    }

    get started() {
        return this.elementObserver.started;
    }

    // Element observer delegate
    matchElement(element) {
        return element.hasAttribute(this.attributeName);
    }

    matchElementsInTree(tree) {
        const match = this.matchElement(tree) ? [tree] : [];
        const matches = Array.from(tree.querySelectorAll(this.selector));
        return match.concat(matches);
    }

    elementMatched(element) {
        if (this.delegate.elementMatchedAttribute) {
            this.delegate.elementMatchedAttribute(element, this.attributeName);
        }
    }

    elementUnmatched(element) {
        if (this.delegate.elementUnmatchedAttribute) {
            this.delegate.elementUnmatchedAttribute(element, this.attributeName);
        }
    }

    elementAttributeChanged(element, attributeName) {
        if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
            this.delegate.elementAttributeValueChanged(element, attributeName);
        }
    }
}
