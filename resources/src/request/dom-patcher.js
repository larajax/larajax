export var DomUpdateMode = {
    replaceWith: 'replace',
    prepend: 'prepend',
    append: 'append',
    update: 'innerHTML'
}

export class DomPatcher
{
    constructor(envelope, partialMap, options = {}) {
        this.options = options;
        this.envelope = envelope;
        this.partialMap = partialMap;
        this.afterUpdateCallback = null;
    }

    apply() {
        this.applyPartialUpdates();
        this.applyDomUpdates();
    }

    afterUpdate(callback) {
        this.afterUpdateCallback = callback;
    }

    // Should patch the dom using the envelope.getPartials()
    // which is expected to be { partialName: html contents }
    applyPartialUpdates() {
        const partials = this.envelope.getPartials();

        partials.forEach((partial) => {
            const selector = this.partialMap[partial.name];
            let selectedEl = [];

            // If the update options has a _self, values like true and '^' will resolve to the partial element,
            // these values are also used to make AJAX partial handlers available without performing an update
            if (this.partialMap['_self'] && partial == this.options.partial && this.options.partialEl) {
                selector = this.partialMap['_self'];
                selectedEl = [this.options.partialEl];
            }
            else if (selector) {
                selectedEl = resolveSelectorResponse(selector, '[data-ajax-partial="'+partial+'"]');
            }

            selectedEl.forEach((el) => {
                this.patchDom(
                    el,
                    partial.html,
                    getSelectorUpdateMode(selector, el)
                );
            });
        });
    }

    // Should patch the dom using the envelope.getDomPatches()
    applyDomUpdates() {
        const updates = this.envelope.getDomPatches();

        updates.forEach((update) => {
            document.querySelectorAll(update.selector).forEach((el) => {
                this.patchDom(el, update.html, update.swap);
            });
        });
    }

    patchDom(element, content, swapType) {
        const parentEl = element.parentNode;
        switch (swapType) {
            case 'append':
            case 'beforeend':
                element.insertAdjacentHTML('beforeend', content);
                runScriptsOnFragment(element, content);
                break;
            case 'afterend':
                element.insertAdjacentHTML('afterend', content);
                runScriptsOnFragment(element, content);
                break;
            case 'beforebegin':
                element.insertAdjacentHTML('beforebegin', content);
                runScriptsOnFragment(element, content);
                break;
            case 'prepend':
            case 'afterbegin':
                element.insertAdjacentHTML('afterbegin', content);
                runScriptsOnFragment(element, content);
                break;
            case 'replace':
                element.replaceWith(content);
                runScriptsOnFragment(parentEl, content);
                break;
            case 'outerHTML':
                element.outerHTML = content;
                runScriptsOnFragment(parentEl, content);
                break;
            default:
            case 'innerHTML':
                element.innerHTML = content;
                runScriptsOnElement(element);
                break;
        }

        if (this.afterUpdateCallback) {
            this.afterUpdateCallback(element);
        }
    }
}

export function resolveSelectorResponse(selector, partialSelector) {
    // Look for AJAX partial selectors
    if (selector === true) {
        return document.querySelectorAll(partialSelector);
    }

    // Selector is DOM element
    if (typeof selector !== 'string') {
        return [selector];
    }

    // Invalid selector
    if (['#', '.', '@', '^', '!', '='].indexOf(selector.charAt(0)) === -1) {
        return [];
    }

    // Append, prepend, replace with or custom selector
    if (['@', '^', '!', '='].indexOf(selector.charAt(0)) !== -1) {
        selector = selector.substring(1);
    }

    // Empty selector remains
    if (!selector) {
        selector = partialSelector;
    }

    return document.querySelectorAll(selector);
}

function getSelectorUpdateMode(selector, el) {
    // Look at selector prefix
    if (typeof selector === 'string') {
        if (selector.charAt(0) === '!') {
            return DomUpdateMode.replaceWith;
        }
        if (selector.charAt(0) === '@') {
            return DomUpdateMode.append;
        }
        if (selector.charAt(0) === '^') {
            return DomUpdateMode.prepend;
        }
    }

    // Look at element dataset
    if (el.dataset.ajaxUpdateMode !== undefined) {
        return el.dataset.ajaxUpdateMode;
    }

    // Default mode
    return DomUpdateMode.update;
}

// Replaces blocked scripts with fresh nodes
function runScriptsOnElement(el) {
    Array.from(el.querySelectorAll('script')).forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes)
            .forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

// Runs scripts on a fragment inside a container
function runScriptsOnFragment(container, html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    Array.from(div.querySelectorAll('script')).forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes)
            .forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        container.appendChild(newScript);
        container.removeChild(newScript);
    });
}
