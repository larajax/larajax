export class Scope
{
    constructor(element, identifier) {
        this.element = element;
        this.identifier = identifier;

        this.containsElement = (element) => {
            return element.closest(this.controlSelector) === this.element;
        };
    }

    findElement(selector) {
        return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
    }

    findAllElements(selector) {
        return [
            ...(this.element.matches(selector) ? [this.element] : []),
            ...this.queryElements(selector).filter(this.containsElement),
        ];
    }

    queryElements(selector) {
        return Array.from(this.element.querySelectorAll(selector));
    }

    get controlSelector() {
        return attributeValueContainsToken('data-control', this.identifier);
    }

    get isDocumentScope() {
        return this.element === document.documentElement;
    }

    get documentScope() {
        return this.isDocumentScope
            ? this
            : new Scope(document.documentElement, this.identifier);
    }
}

function attributeValueContainsToken(attributeName, token) {
    return `[${attributeName}~="${token}"]`
}
