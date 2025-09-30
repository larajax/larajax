import { array } from "../util";

export class Renderer
{
    renderView(callback) {
        const renderInterception = () => {
            callback();
            this.delegate.viewRendered(this.newBody);
        };

        const options = { resume: renderInterception };
        const immediateRender = this.delegate.viewAllowsImmediateRender(this.newBody, options);
        if (immediateRender) {
            renderInterception();
        }
    }

    invalidateView() {
        this.delegate.viewInvalidated();
    }

    createScriptElement(element) {
        if (
            element.getAttribute('data-turbo-eval') === 'false' ||
            this.delegate.applicationHasSeenInlineScript(element)
        ) {
            return element;
        }

        const createdScriptElement = document.createElement('script');
        createdScriptElement.textContent = element.textContent;
        createdScriptElement.async = false;
        copyElementAttributes(createdScriptElement, element);
        return createdScriptElement;
    }
}

function copyElementAttributes(destinationElement, sourceElement) {
    for (const { name, value } of array(sourceElement.attributes)) {
        destinationElement.setAttribute(name, value);
    }
}
