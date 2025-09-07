export function add(map, key, value) {
    fetch(map, key).add(value);
}

export function del(map, key, value) {
    fetch(map, key).delete(value);
    prune(map, key);
}

export function fetch(map, key) {
    let values = map.get(key);
    if (!values) {
        values = new Set();
        map.set(key, values);
    }
    return values;
}

export function prune(map, key) {
    const values = map.get(key);
    if (values != null && values.size == 0) {
        map.delete(key);
    }
}
