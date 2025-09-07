/**
 * Function to wait for predicates.
 * @param {function() : Boolean} predicate - A function that returns a bool
 * @param {Number} [timeout] - Optional maximum waiting time in ms after rejected
 */
export function waitFor(predicate, timeout) {
    return new Promise((resolve, reject) => {
        const check = () => {
            if (!predicate()) {
                return;
            }
            clearInterval(interval);
            resolve();
        };
        const interval = setInterval(check, 100);
        check();

        if (!timeout) {
          return;
        }

        setTimeout(() => {
            clearInterval(interval);
            reject();
        }, timeout);
    });
}

/**
 * Function to wait for the DOM to be ready, if not already
 */
export function domReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => resolve());
        }
        else {
            resolve();
        }
    });
}
