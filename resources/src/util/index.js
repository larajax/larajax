export function dispatch(eventName, { target = document, detail = {}, bubbles = true, cancelable = true } = {}) {
    const event = new CustomEvent(eventName, { detail, bubbles, cancelable });
    target.dispatchEvent(event);
    return event;
}

export function defer(callback) {
    setTimeout(callback, 1);
}

export function unindent(strings, ...values) {
    const lines = trimLeft(interpolate(strings, values)).split("\n");
    const match = lines[0].match(/^\s+/);
    const indent = match ? match[0].length : 0;
    return lines.map(line => line.slice(indent)).join("\n");
}

function trimLeft(string) {
    return string.replace(/^\n/, "");
}

function interpolate(strings, values) {
    return strings.reduce((result, string, i) => {
        const value = values[i] == undefined ? "" : values[i];
        return result + string + value;
    }, "");
}

export function array(values) {
    return Array.prototype.slice.call(values);
}

export function uuid() {
    return Array.apply(null, { length: 36 }).map((_, i) => {
        if (i == 8 || i == 13 || i == 18 || i == 23) {
            return "-";
        }
        else if (i == 14) {
            return "4";
        }
        else if (i == 19) {
            return (Math.floor(Math.random() * 4) + 8).toString(16);
        }
        else {
            return Math.floor(Math.random() * 15).toString(16);
        }
    }).join("");
}
