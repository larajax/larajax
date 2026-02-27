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

    render({ snapshot, error }, callback) {
        if (snapshot) {
            this.renderSnapshot(snapshot, callback);
        }
        else {
            this.renderError(error, callback);
        }
    }

    // Private
    renderSnapshot(snapshot, callback) {
        SnapshotRenderer.render(this.delegate, callback, this.getSnapshot(), snapshot);
    }

    renderError(error, callback) {
        ErrorRenderer.render(this.delegate, callback, error || '');
    }
}
