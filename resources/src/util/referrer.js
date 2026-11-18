import { isTurboEnabled, getTurboController } from "./turbo";

/**
 * getReferrerUrl returns the last visited URL, and when a fallback URL
 * is given, only if it is the same page and the fallback has no query
 */
export function getReferrerUrl(fallbackUrl = null) {
    const url = isTurboEnabled()
        ? getTurboController().getLastVisitUrl()
        : getReferrerFromSameOrigin();

    if (!url || isSamePage(url, window.location.href)) {
        return null;
    }

    if (fallbackUrl && (hasQuery(fallbackUrl) || !isSamePage(url, fallbackUrl))) {
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

function hasQuery(url) {
    return new URL(url, window.location.href).search !== '';
}

function isSamePage(url, otherUrl) {
    const givenUrl = new URL(url, window.location.href),
        comparedUrl = new URL(otherUrl, window.location.href);

    return givenUrl.origin === comparedUrl.origin && givenUrl.pathname === comparedUrl.pathname;
}
