import { Renderer } from "./renderer";
import { array } from "../util";

export class ErrorRenderer extends Renderer
{
    constructor(delegate, html) {
        super();
        this.delegate = delegate;
        this.htmlElement = (() => {
            const htmlElement = document.createElement('html');
            htmlElement.innerHTML = html;
            return htmlElement;
        })();
        this.newHead = this.htmlElement.querySelector('head') || document.createElement('head');
        this.newBody = this.htmlElement.querySelector('body') || document.createElement('body');
    }

    static render(delegate, callback, html) {
        return new this(delegate, html).render(callback);
    }

    render(callback) {
        this.renderView(() => {
            this.replaceHeadAndBody();
            this.activateBodyScriptElements();
            callback();
        });
    }

    replaceHeadAndBody() {
        const { documentElement, head, body } = document;
        documentElement.replaceChild(this.newHead, head);
        documentElement.replaceChild(this.newBody, body);
    }

    activateBodyScriptElements() {
        for (const replaceableElement of this.getScriptElements()) {
            const parentNode = replaceableElement.parentNode;
            if (parentNode) {
                const element = this.createScriptElement(replaceableElement);
                parentNode.replaceChild(element, replaceableElement);
            }
        }
    }

    getScriptElements() {
        return array(document.documentElement.querySelectorAll('script'));
    }
}
