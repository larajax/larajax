/**
 * getReferrerUrl returns the last visited URL
 */
export function getReferrerUrl() {
    const url = jax.useTurbo && jax.useTurbo()
        ? jax.AjaxTurbo.controller.getLastVisitUrl()
        : getReferrerFromSameOrigin();


    if (!url || isSameBaseUrl(url)) {
        return null;
    }

    return url;
}

function getReferrerFromSameOrigin() {
    if (!document.referrer) {
        return null;
    }

    // Fallback when turbo router is not activated
    try {
        const referrer = new URL(document.referrer);
        if (referrer.origin !== location.origin) {
            return null;
        }

        const pushReferrer = localStorage.getItem('ocPushStateReferrer');
        if (pushReferrer && pushReferrer.indexOf(referrer.pathname) === 0) {
            return pushReferrer;
        }

        return document.referrer;
    }
    catch (e) {
    }
}

function isSameBaseUrl(url) {
    const givenUrl = new URL(url, window.location.origin),
        currentUrl = new URL(window.location.href);

    return givenUrl.origin === currentUrl.origin && givenUrl.pathname === currentUrl.pathname;
}
