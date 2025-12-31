export class Envelope
{
    constructor(response = {}, status = 200) {
        const {
            __ajax: body,
            ...data
        } = response;

        this.ok = !!body.ok;
        this.severity = body.severity || 'info';
        this.message = body.message ?? null;
        this.data = data || {};
        this.invalid = body.invalid || {};
        this.ops = Array.isArray(body.ops) ? body.ops : [];
        this.redirect = null;
        this.status = status;
    }

    isFatal() {
        return this.severity === 'fatal' || (this.status >= 500 && this.status <= 599);
    }

    isError() {
        return this.severity === 'error' || this.isFatal() || this.ok === false;
    }

    getMessage() {
        return this.message;
    }

    getInvalid() {
        return this.invalid || {};
    }

    getData() {
        return this.data || {};
    }

    getStatus() {
        return this.status;
    }

    getSeverity() {
        return this.severity;
    }

    getOps(type) {
        if (!type) {
            return this.ops;
        }

        return this.ops.filter(o => o?.op === type);
    }

    getFlash() {
        return this.getOps('flash')
            .map(({ level = 'info', text = '' }) => ({ level, text }));
    }

    getBrowserEvents() {
        return this.getOps('dispatch')
            .map(({ selector = null, event, detail, async }) => ({
                selector, event, detail, async
            }));
    }

    getDomPatches() {
        return this.getOps('patchDom')
            .map(({ selector, html = '', swap = 'innerHTML' }) => ({
                selector, html, swap
            }));
    }

    getPartials() {
        return this.getOps('partial')
            .map(({ name, html = '' }) => ({ name, html }));
    }

    getAssets() {
        const out = { js: [], css: [], img: [] };
        const seen = { js: new Set(), css: new Set(), img: new Set() };

        for (const { type, assets = [] } of this.getOps('loadAssets')) {
            if (!out[type]) {
                continue;
            }

            for (const asset of assets) {
                // Handle both string and { url, attributes } formats
                const url = typeof asset === 'string' ? asset : asset.url;
                if (!seen[type].has(url)) {
                    seen[type].add(url);
                    out[type].push(typeof asset === 'string' ? { url: asset } : asset);
                }
            }
        }

        return out;
    }

    getRedirectUrl() {
        const op = this.getOps('redirect')[0];
        return op?.url || this.redirect || null;
    }

    getReload() {
        return this.getOps('reload')[0] || null;
    }
}
