import { array } from "../util";

export class Renderer
{
    renderView(callback) {
        const renderInterception = () => {
            const completeRender = () => {
                callback();
                this.delegate.viewRendered(this.newBody);
            };

            if (this.willPerformViewTransition()) {
                const transition = document.startViewTransition(() => completeRender());
                if (typeof this.delegate.setViewTransitionFinished === 'function') {
                    this.delegate.setViewTransitionFinished(transition.finished);
                }
            }
            else {
                completeRender();
            }
        };

        const options = { resume: renderInterception };
        const immediateRender = this.delegate.viewAllowsImmediateRender(this.newBody, options);
        if (immediateRender) {
            renderInterception();
        }
    }

    willPerformViewTransition() {
        return (
            typeof document.startViewTransition === 'function' &&
            typeof this.delegate.viewTransitionEnabled === 'function' &&
            this.delegate.viewTransitionEnabled()
        );
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
