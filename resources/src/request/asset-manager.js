export class AssetManager
{
    /**
     * Load a collection of assets.
     * @param {{js?: Array<{url: string, attributes?: object}>, css?: Array<{url: string, attributes?: object}>, img?: Array<{url: string, attributes?: object}>}} collection
     * @param {(err?: Error) => void} [callback]  // optional; called on success or with error
     * @returns {Promise<void>}
     */
    static load(collection = {}, callback) {
        const manager = new AssetManager(),
            promise = manager.loadCollection(collection);

        if (typeof callback === 'function') {
            promise.then(() => callback());
        }

        return promise;
    }

    async loadCollection(collection = {}) {
        const jsList  = (collection.js  ?? []).filter(asset => !document.querySelector(`head script[src="${htmlEscape(asset.url)}"]`));
        const cssList = (collection.css ?? []).filter(asset => !document.querySelector(`head link[href="${htmlEscape(asset.url)}"]`));
        const imgList = collection.img ?? [];

        if (!jsList.length && !cssList.length && !imgList.length) {
            return;
        }

        await Promise.all([
            this.loadJavaScript(jsList),
            Promise.all(cssList.map(asset => this.loadStyleSheet(asset))),
            this.loadImages(imgList)
        ]);
    }

    loadStyleSheet(asset) {
        const { url, attributes = {} } = asset;
        return new Promise((resolve, reject) => {
            const el = document.createElement('link');
            el.rel = 'stylesheet';
            el.type = 'text/css';
            el.href = url;

            // Apply custom attributes
            for (const [key, value] of Object.entries(attributes)) {
                if (value === true) {
                    el.setAttribute(key, '');
                }
                else if (value !== false && value != null) {
                    el.setAttribute(key, value);
                }
            }

            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
            document.head.appendChild(el);
        });
    }

    // Sequential loading (safer for dependencies)
    loadJavaScript(list) {
        return list.reduce((p, asset) => {
            const { url, attributes = {} } = asset;
            return p.then(() => new Promise((resolve, reject) => {
                const el = document.createElement('script');

                // Set type based on attributes, default to text/javascript unless 'module' is specified
                if (attributes.type) {
                    el.type = attributes.type;
                }
                else {
                    el.type = 'text/javascript';
                }

                el.src = url;

                // Apply custom attributes (skip 'type' as it's already handled)
                for (const [key, value] of Object.entries(attributes)) {
                    if (key === 'type') continue;

                    if (value === true) {
                        el.setAttribute(key, '');
                    }
                    else if (value !== false && value != null) {
                        el.setAttribute(key, value);
                    }
                }

                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error(`Failed to load JS: ${url}`));
                document.head.appendChild(el);
            }));
        }, Promise.resolve());
    }

    loadImages(list) {
        if (!list.length) return Promise.resolve();
        return Promise.all(list.map(asset => new Promise((resolve, reject) => {
            const { url } = asset;
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        })));
    }
}

// Minimal escaping for querySelector
function htmlEscape(value) {
    return String(value).replace(/"/g, '\\"');
}
