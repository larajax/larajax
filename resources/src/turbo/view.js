import { ErrorRenderer } from "./error-renderer";
import { Snapshot } from "./snapshot";
import { SnapshotRenderer } from "./snapshot-renderer";

export class View
{
    constructor(delegate) {
        this.htmlElement = document.documentElement;
        this.delegate = delegate;
    }

    getRootLocation() {
        return this.getSnapshot().getRootLocation();
    }

    getElementForAnchor(anchor) {
        return this.getSnapshot().getElementForAnchor(anchor);
    }

    getSnapshot() {
        return Snapshot.fromHTMLElement(this.htmlElement);
    }

    render({ snapshot, error, isPreview }, callback) {
        this.markAsPreview(isPreview);
        if (snapshot) {
            this.renderSnapshot(snapshot, isPreview, callback);
        }
        else {
            this.renderError(error, callback);
        }
    }

    // Private
    markAsPreview(isPreview) {
        if (isPreview) {
            this.htmlElement.setAttribute('data-turbo-preview', '');
        }
        else {
            this.htmlElement.removeAttribute('data-turbo-preview');
        }
    }

    renderSnapshot(snapshot, isPreview, callback) {
        SnapshotRenderer.render(this.delegate, callback, this.getSnapshot(), snapshot, isPreview || false);
    }

    renderError(error, callback) {
        ErrorRenderer.render(this.delegate, callback, error || '');
    }
}
