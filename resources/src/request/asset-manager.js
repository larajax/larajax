export class AssetManager
{
    /**
     * Load a collection of assets.
     * @param {{js?: string[], css?: string[], img?: string[]}} collection
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
        const jsList  = (collection.js  ?? []).filter(src  => !document.querySelector(`head script[src="${htmlEscape(src)}"]`));
        const cssList = (collection.css ?? []).filter(href => !document.querySelector(`head link[href="${htmlEscape(href)}"]`));
        const imgList = collection.img ?? [];

        if (!jsList.length && !cssList.length && !imgList.length) {
            return;
        }

        await Promise.all([
            this.loadJavaScript(jsList),
            Promise.all(cssList.map(h => this.loadStyleSheet(h))),
            this.loadImages(imgList)
        ]);
    }

    loadStyleSheet(href) {
        return new Promise((resolve, reject) => {
            const el = document.createElement('link');
            el.rel = 'stylesheet';
            el.type = 'text/css';
            el.href = href;
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            document.head.appendChild(el);
        });
    }

    // Sequential loading (safer for dependencies)
    loadJavaScript(list) {
        return list.reduce((p, src) => {
            return p.then(() => new Promise((resolve, reject) => {
                const el = document.createElement('script');
                el.type = 'text/javascript';
                el.src = src;
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
                document.head.appendChild(el);
            }));
        }, Promise.resolve());
    }

    loadImages(list) {
        if (!list.length) return Promise.resolve();
        return Promise.all(list.map(src => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        })));
    }
}

// Minimal escaping for querySelector
function htmlEscape(value) {
    return String(value).replace(/"/g, '\\"');
}
