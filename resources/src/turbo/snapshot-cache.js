export class SnapshotCache
{
    constructor(size) {
        this.keys = [];
        this.snapshots = {};
        this.size = size;
    }

    has(location) {
        return location.toCacheKey() in this.snapshots;
    }

    get(location) {
        if (this.has(location)) {
            const snapshot = this.read(location);
            this.touch(location);
            return snapshot;
        }
    }

    put(location, snapshot) {
        this.write(location, snapshot);
        this.touch(location);
        return snapshot;
    }

    // Private
    read(location) {
        return this.snapshots[location.toCacheKey()];
    }

    write(location, snapshot) {
        this.snapshots[location.toCacheKey()] = snapshot;
    }

    touch(location) {
        const key = location.toCacheKey();
        const index = this.keys.indexOf(key);
        if (index > -1)
            this.keys.splice(index, 1);
        this.keys.unshift(key);
        this.trim();
    }

    trim() {
        for (const key of this.keys.splice(this.size)) {
            delete this.snapshots[key];
        }
    }
}
