export class Location
{
    constructor(url) {
        const linkWithAnchor = document.createElement('a');
        linkWithAnchor.href = url;
        this.absoluteURL = linkWithAnchor.href;
        const anchorLength = linkWithAnchor.hash.length;
        if (anchorLength < 2) {
            this.requestURL = this.absoluteURL;
        }
        else {
            this.requestURL = this.absoluteURL.slice(0, -anchorLength);
            this.anchor = linkWithAnchor.hash.slice(1);
        }
    }

    static get currentLocation() {
        return this.wrap(window.location.toString());
    }

    static wrap(locatable) {
        if (typeof locatable == 'string') {
            return new Location(locatable);
        }
        else if (locatable != null) {
            return locatable;
        }
    }

    getOrigin() {
        return this.absoluteURL.split("/", 3).join("/");
    }

    getPath() {
        return (this.requestURL.match(/\/\/[^/]*(\/[^?;]*)/) || [])[1] || "/";
    }

    getPathComponents() {
        return this.getPath().split("/").slice(1);
    }

    getLastPathComponent() {
        return this.getPathComponents().slice(-1)[0];
    }

    getExtension() {
        return (this.getLastPathComponent().match(/\.[^.]*$/) || [])[0] || "";
    }

    isHTML() {
        return this.getExtension().match(/^(?:|\.(?:htm|html|xhtml))$/);
    }

    isPrefixedBy(location) {
        const prefixURL = getPrefixURL(location);
        return this.isEqualTo(location) || stringStartsWith(this.absoluteURL, prefixURL);
    }

    isEqualTo(location) {
        return location && this.absoluteURL === location.absoluteURL;
    }

    toCacheKey() {
        return this.requestURL;
    }

    toJSON() {
        return this.absoluteURL;
    }

    toString() {
        return this.absoluteURL;
    }

    valueOf() {
        return this.absoluteURL;
    }
}

function getPrefixURL(location) {
    return addTrailingSlash(location.getOrigin() + location.getPath());
}

function addTrailingSlash(url) {
    return stringEndsWith(url, "/") ? url : url + "/";
}

function stringStartsWith(string, prefix) {
    return string.slice(0, prefix.length) === prefix;
}

function stringEndsWith(string, suffix) {
    return string.slice(-suffix.length) === suffix;
}
