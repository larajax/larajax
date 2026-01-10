let _turboProvider = null;

export function registerTurbo(turbo) {
    _turboProvider = turbo;
}

export function isTurboEnabled() {
    return _turboProvider?.isEnabled() ?? false;
}

export function turboVisit(url, options) {
    if (_turboProvider) {
        _turboProvider.visit(url, options);
        return true;
    }
    return false;
}

export function getTurboController() {
    return _turboProvider?.controller ?? null;
}

export function turboPageReady() {
    return _turboProvider?.pageReady() ?? null;
}
