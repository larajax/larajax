import { array } from "../util";

export class HeadDetails
{
    constructor(children) {
        this.detailsByOuterHTML = children.reduce((result, element) => {
            const { outerHTML } = element;
            const details = outerHTML in result
                ? result[outerHTML]
                : {
                    type: elementType(element),
                    tracked: elementIsTracked(element),
                    elements: []
                };
            return Object.assign(Object.assign({}, result), { [outerHTML]: Object.assign(Object.assign({}, details), { elements: [...details.elements, element] }) });
        }, {});
    }

    static fromHeadElement(headElement) {
        const children = headElement ? array(headElement.children) : [];
        return new this(children);
    }

    getTrackedElementSignature() {
        return Object.keys(this.detailsByOuterHTML)
            .filter(outerHTML => this.detailsByOuterHTML[outerHTML].tracked)
            .join("");
    }

    getScriptElementsNotInDetails(headDetails) {
        return this.getElementsMatchingTypeNotInDetails('script', headDetails);
    }

    getStylesheetElementsNotInDetails(headDetails) {
        return this.getElementsMatchingTypeNotInDetails('stylesheet', headDetails);
    }

    getElementsMatchingTypeNotInDetails(matchedType, headDetails) {
        return Object.keys(this.detailsByOuterHTML)
            .filter(outerHTML => !(outerHTML in headDetails.detailsByOuterHTML))
            .map(outerHTML => this.detailsByOuterHTML[outerHTML])
            .filter(({ type }) => type == matchedType)
            .map(({ elements: [element] }) => element);
    }

    getProvisionalElements() {
        return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
            const { type, tracked, elements } = this.detailsByOuterHTML[outerHTML];
            if (type == null && !tracked) {
                return [...result, ...elements];
            }
            else if (elements.length > 1) {
                return [...result, ...elements.slice(1)];
            }
            else {
                return result;
            }
        }, []);
    }

    getMetaValue(name) {
        const element = this.findMetaElementByName(name);
        return element
            ? element.getAttribute('content')
            : null;
    }

    findMetaElementByName(name) {
        return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
            const { elements: [element] } = this.detailsByOuterHTML[outerHTML];
            return elementIsMetaElementWithName(element, name) ? element : result;
        }, undefined);
    }
}

function elementType(element) {
    if (elementIsScript(element)) {
        return 'script';
    }

    else if (elementIsStylesheet(element)) {
        return 'stylesheet';
    }
}

function elementIsTracked(element) {
    return element.getAttribute('data-turbo-track') == 'reload';
}

function elementIsScript(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == 'script';
}

function elementIsStylesheet(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == 'style' || (tagName == 'link' && element.getAttribute('rel') == 'stylesheet');
}

function elementIsMetaElementWithName(element, name) {
    const tagName = element.tagName.toLowerCase();
    return tagName == 'meta' && element.getAttribute('name') == name;
}
