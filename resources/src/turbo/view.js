import { ErrorRenderer } from "./error-renderer";
import { Page } from "./page";
import { PageRenderer } from "./page-renderer";

export class View
{
    constructor(delegate) {
        this.htmlElement = document.documentElement;
        this.delegate = delegate;
    }

    getRootLocation() {
        return this.getPage().getRootLocation();
    }

    getElementForAnchor(anchor) {
        return this.getPage().getElementForAnchor(anchor);
    }

    getPage() {
        return Page.fromHTMLElement(this.htmlElement);
    }

    render({ page, error }, callback) {
        if (page) {
            this.renderPage(page, callback);
        }
        else {
            this.renderError(error, callback);
        }
    }

    // Private
    renderPage(page, callback) {
        PageRenderer.render(this.delegate, callback, this.getPage(), page);
    }

    renderError(error, callback) {
        ErrorRenderer.render(this.delegate, callback, error || '');
    }
}
