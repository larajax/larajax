import { unindent } from "../util";

export class AttachLoader
{
    static stylesheetReady = false;

    constructor() {
        this.stylesheetElement = this.createStylesheetElement();
    }

    static get defaultCSS() {
        return unindent `
        .oc-attach-loader:after {
            content: '';
            display: inline-block;
            vertical-align: middle;
            margin-left: .4em;
            height: 1em;
            width: 1em;
            animation: oc-rotate-loader 0.8s infinite linear;
            border: .2em solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            opacity: .5;
        }
        @keyframes oc-rotate-loader {
            0% { transform: rotate(0deg); }
            100%  { transform: rotate(360deg); }
        }
    `;
    }

    static get attachLoader() {
        return {
            show: function(el) {
                (new AttachLoader).show(resolveElement(el));
            },
            hide: function(el) {
                (new AttachLoader).hide(resolveElement(el));
            },
            hideAll: function() {
                (new AttachLoader).hideAll();
            }
        };
    }

    // Public
    show(el) {
        this.installStylesheetElement();

        if (isElementInput(el)) {
            const loadEl = document.createElement('span');
            loadEl.className = 'oc-attach-loader is-inline';
            el.parentNode.insertBefore(loadEl, el.nextSibling); // insertAfter
        }
        else {
            el.classList.add('oc-attach-loader');
            el.disabled = true;
        }
    }

    hide(el) {
        if (isElementInput(el)) {
            if (el.nextElementSibling && el.nextElementSibling.classList.contains('oc-attach-loader')) {
                el.nextElementSibling.remove();
            }
        }
        else {
            el.classList.remove('oc-attach-loader');
            el.disabled = false;
        }
    }

    hideAll() {
        document.querySelectorAll('.oc-attach-loader.is-inline').forEach((el) => {
            el.remove();
        });

        document.querySelectorAll('.oc-attach-loader').forEach((el) => {
            el.classList.remove('oc-attach-loader');
            el.disabled = false;
        });
    }

    showForm(el) {
        if (el.dataset.attachLoading !== undefined) {
            this.show(el);
        }

        if (el.matches('form')) {
            var self = this;
            el.querySelectorAll('[data-attach-loading][type=submit]').forEach(function(otherEl) {
                if (!isElementInput(otherEl)) {
                    self.show(otherEl);
                }
            });
        }
    }

    hideForm(el) {
        if (el.dataset.attachLoading !== undefined) {
            this.hide(el);
        }

        if (el.matches('form')) {
            var self = this;
            el.querySelectorAll('[data-attach-loading]').forEach(function(otherEl) {
                if (!isElementInput(otherEl)) {
                    self.hide(otherEl);
                }
            });
        }
    }

    // Private
    installStylesheetElement() {
        if (!AttachLoader.stylesheetReady) {
            document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
            AttachLoader.stylesheetReady = true;
        }
    }

    createStylesheetElement() {
        const element = document.createElement('style');
        element.textContent = AttachLoader.defaultCSS;
        return element;
    }
}

function isElementInput(el) {
    return ['input', 'select', 'textarea'].includes((el.tagName || '').toLowerCase());
}

function resolveElement(el) {
    if (typeof el === 'string') {
        el = document.querySelector(el);
    }

    if (!el) {
        throw new Error("Invalid element for attach loader.");
    }

    return el;
}
