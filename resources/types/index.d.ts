declare module 'larajax';

type Constructor<T> = new (...args: any[]) => T;

type ResponseCallback<T = DataResponse> = (data: T, responseCode: number, xhr: XMLHttpRequest) => void | Promise<void>;

type DataResponse = Record<string, unknown>;

// ============================================================================
// Progress Bar
// ============================================================================

export interface ProgressBar {
    show(options?: { cssClass?: string }): void;
    hide(): void;
    setValue(value: number): void;
}

// The singleton accessor (used via jax.progressBar and AjaxExtras.progressBar)
export interface ProgressBarAccessor {
    show(): void;
    hide(): void;
}

// ============================================================================
// Flash Message
// ============================================================================

export interface FlashMessageOptions {
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'loading';
    replace?: number;
    hideAll?: boolean;
    interval?: number;
    target?: HTMLElement;
    // Legacy options
    text?: string;
    class?: string;
}

// ============================================================================
// Request Options
// ============================================================================

export interface RequestOptions<T = DataResponse> {
    // Response handling
    update?: Record<string, string>;
    partial?: string | boolean;
    download?: boolean | string;

    // Form & data
    form?: HTMLElement | string;
    data?: Record<string, unknown>;
    bulk?: boolean;
    files?: boolean;

    // URL & headers
    url?: string;
    headers?: Record<string, string>;

    // User feedback
    message?: string;
    confirm?: string;
    progressBar?: boolean;
    progressBarDelay?: number;
    flash?: boolean;

    // Loading UI
    loading?: string | HTMLElement;

    // Validation
    browserValidate?: boolean;

    // Navigation
    redirect?: string | null;
    browserTarget?: string;
    browserRedirectBack?: boolean;

    // Query parameters
    query?: boolean | Record<string, unknown>;

    // Callbacks
    beforeUpdate?: (data: T, responseCode: number, xhr: XMLHttpRequest) => boolean | void;
    afterUpdate?: (data: T, responseCode: number, xhr: XMLHttpRequest) => void;
    success?: ResponseCallback<T>;
    error?: ResponseCallback<T>;
    complete?: ResponseCallback<T>;
    cancel?: () => void;

    // Custom handlers
    handleConfirmMessage?: (message: string) => boolean;
    handleProgressMessage?: (message: string, isDone: boolean) => void;
    handleFlashMessage?: (message: string, type: string) => void;
    handleErrorMessage?: (message: string) => void;
    handleValidationMessage?: (message: string, fields: Record<string, string[]>) => void;
    handleBrowserEvents?: (events: BrowserEvent[]) => Promise<boolean>;
    handleRedirectResponse?: (href: string) => void;
    handleReloadResponse?: () => void;
    markAsUpdating?: (isUpdating: boolean) => void;
    handleUpdateResponse?: (data: T, responseCode: number, xhr: XMLHttpRequest) => void;
    handleFileDownload?: (data: Blob, xhr: XMLHttpRequest) => void;
    applyQueryToUrl?: (queryData: Record<string, unknown>) => void;
}

// ============================================================================
// Browser Event
// ============================================================================

export interface BrowserEvent {
    selector?: string | null;
    event: string;
    detail?: unknown;
    async?: boolean;
}

// ============================================================================
// Request Context
// ============================================================================

export interface RequestContext<T = DataResponse> {
    el: HTMLElement;
    handler: string;
    options: RequestOptions<T>;
}

// ============================================================================
// Asset Manager
// ============================================================================

export interface AssetCollection {
    js?: Array<string | { url: string; attributes?: Record<string, string> }>;
    css?: Array<string | { url: string; attributes?: Record<string, string> }>;
    img?: Array<string | { url: string; attributes?: Record<string, string> }>;
}

export interface AssetManager {
    load(collection: AssetCollection, callback?: (err?: Error) => void): Promise<void>;
}

// ============================================================================
// Control Base (Observe Module)
// ============================================================================

export interface ControlBase {
    readonly element: HTMLElement;
    readonly identifier: string;
    readonly config: Record<string, unknown>;

    init(): void;
    connect(): void;
    disconnect(): void;

    listen(eventName: string, handler: EventListener, options?: AddEventListenerOptions): void;
    listen(eventName: string, selector: string, handler: EventListener, options?: AddEventListenerOptions): void;
    listen(eventName: string, element: Element, handler: EventListener, options?: AddEventListenerOptions): void;

    forget(eventName: string, handler: EventListener, options?: EventListenerOptions): void;
    forget(eventName: string, selector: string, handler: EventListener, options?: EventListenerOptions): void;
    forget(eventName: string, element: Element, handler: EventListener, options?: EventListenerOptions): void;

    dispatch(eventName: string, options?: {
        target?: Element;
        detail?: unknown;
        prefix?: string;
        bubbles?: boolean;
        cancelable?: boolean;
    }): CustomEvent;

    proxy<T extends (...args: any[]) => any>(method: T): T;
    parseDataset(dataset: DOMStringMap): Record<string, unknown>;
    parseValue(value: string): unknown;
}

// ============================================================================
// Events Utility
// ============================================================================

export interface Events {
    on(element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions): void;
    on(element: Element, event: string, selector: string, handler: EventListener, options?: AddEventListenerOptions): void;

    one(element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions): void;
    one(element: Element, event: string, selector: string, handler: EventListener, options?: AddEventListenerOptions): void;

    off(element: Element, event: string, handler?: EventListener, options?: EventListenerOptions): void;
    off(element: Element, event: string, selector: string, handler?: EventListener, options?: EventListenerOptions): void;

    dispatch(eventName: string, options?: {
        target?: Element | Window;
        detail?: unknown;
        bubbles?: boolean;
        cancelable?: boolean;
    }): CustomEvent;

    trigger(target: Element, eventName: string, options?: CustomEventInit): CustomEvent;
}

// ============================================================================
// Turbo Options
// ============================================================================

export interface TurboVisitOptions {
    action?: 'advance' | 'replace' | 'restore' | 'swap';
    scroll?: boolean;
}

// ============================================================================
// Event Detail Types
// ============================================================================

export interface AjaxEventContext<T = DataResponse> {
    el: HTMLElement;
    handler: string;
    options: RequestOptions<T>;
}

export interface AjaxBeforeSendEvent extends CustomEvent {
    detail: {
        context: AjaxEventContext;
    };
}

export interface AjaxUpdateEvent extends CustomEvent {
    detail: {
        context: AjaxEventContext;
        data: DataResponse;
        responseCode: number;
        xhr: XMLHttpRequest;
    };
}

export interface AjaxBeforeUpdateEvent extends AjaxUpdateEvent {}

export interface AjaxUpdateCompleteEvent extends AjaxUpdateEvent {}

export interface AjaxRequestResponseEvent extends CustomEvent {
    detail: {
        context: AjaxEventContext;
        data: DataResponse;
        responseCode: number;
        xhr: XMLHttpRequest;
    };
}

export interface AjaxRequestSuccessEvent extends AjaxRequestResponseEvent {}

export interface AjaxRequestErrorEvent extends CustomEvent {
    detail: {
        context: AjaxEventContext;
        message: string;
        responseCode: number;
        xhr: XMLHttpRequest;
    };
}

export interface AjaxErrorMessageEvent extends CustomEvent {
    detail: {
        message: string;
    };
}

export interface AjaxConfirmMessageEvent extends CustomEvent {
    detail: {
        message: string;
        promise: {
            resolve: () => void;
            reject: () => void;
        };
    };
}

export interface AjaxSetupEvent extends CustomEvent {
    detail: {
        context: AjaxEventContext;
    };
}

export interface AjaxPromiseEvent extends CustomEvent {
    detail: {
        context: AjaxEventContext;
    };
}

export interface AjaxFailEvent extends AjaxRequestResponseEvent {}

export interface AjaxDoneEvent extends AjaxRequestResponseEvent {}

export interface AjaxAlwaysEvent extends AjaxRequestResponseEvent {}

export interface AjaxInvalidFieldEvent extends CustomEvent {
    detail: {
        element: HTMLElement;
        fieldName: string;
        errorMsg: string;
        isFirst: boolean;
    };
}

export interface AjaxBeforeValidateEvent extends CustomEvent {
    detail: {
        context: AjaxEventContext;
        message: string;
        fields: Record<string, string[]>;
    };
}

export interface AjaxBeforeReplaceEvent extends CustomEvent {
    target: HTMLElement;
}

export interface AjaxRequestStartEvent extends CustomEvent {
    detail: {
        url: string;
        xhr: XMLHttpRequest;
    };
}

export interface AjaxRequestEndEvent extends CustomEvent {
    detail: {
        url: string;
        xhr: XMLHttpRequest;
    };
}

// ============================================================================
// Turbo/Page Events
// ============================================================================

export interface PageClickEvent extends CustomEvent {
    detail: {
        url: string;
    };
}

export interface PageBeforeVisitEvent extends CustomEvent {
    detail: {
        url: string;
        action: string;
    };
}

export interface PageVisitEvent extends CustomEvent {
    detail: {
        url: string;
    };
}

export interface PageBeforeRenderEvent extends CustomEvent {
    detail: {
        newBody: HTMLElement;
    };
}

export interface PageLoadEvent extends CustomEvent {
    detail: {
        url: string;
        timing: Record<string, number>;
    };
}

// ============================================================================
// Namespace Interfaces
// ============================================================================

export interface AjaxFrameworkNamespace {
    parseJSON(text: string): unknown;
    serializeAsJSON(form: HTMLFormElement): Record<string, unknown>;
    requestElement<T = DataResponse>(element: HTMLElement | string, handler?: string, options?: RequestOptions<T>): Promise<T>;
    start(): void;
    stop(): void;
}

export interface AjaxExtrasNamespace {
    flashMsg(options: FlashMessageOptions): number | void;
    progressBar: ProgressBarAccessor;
    attachLoader<T = DataResponse>(element: HTMLElement, handler: string, options?: RequestOptions<T>): void;
    start(): void;
    stop(): void;
}

export interface AjaxObserveNamespace {
    registerControl(id: string, control: Constructor<ControlBase>): void;
    importControl(id: string): Constructor<ControlBase> | undefined;
    observeControl(element: HTMLElement, id: string): ControlBase | null;
    fetchControl(element: HTMLElement | string, identifier?: string): ControlBase | null;
    fetchControls(elements: HTMLElement | string | NodeList, identifier?: string): ControlBase[];
    start(): void;
    stop(): void;
}

export interface AjaxTurboNamespace {
    readonly supported: boolean;
    visit(location: string, options?: TurboVisitOptions): void;
    clearCache(): void;
    setProgressBarVisible(value: boolean): void;
    setProgressBarDelay(delay: number): void;
    isEnabled(): boolean;
    pageReady(): Promise<void>;
    start(): void;
}

// ============================================================================
// Main API Functions
// ============================================================================

declare function ajax<T = DataResponse>(handler: string, options?: RequestOptions<T>): Promise<T>;
declare function request<T = DataResponse>(element: HTMLElement | string, handler: string, options?: RequestOptions<T>): Promise<T>;
declare function parseJSON(text: string): unknown;
declare function values(form: HTMLFormElement): Record<string, unknown>;
declare function flashMsg(options: FlashMessageOptions): number | void;
declare function useTurbo(): boolean;
declare function visit(location: string, options?: TurboVisitOptions): void;
declare function registerControl(id: string, control: Constructor<ControlBase>): void;
declare function importControl(id: string): Constructor<ControlBase> | undefined;
declare function observeControl(element: HTMLElement, id: string): ControlBase | null;
declare function fetchControl(element: HTMLElement | string, identifier?: string): ControlBase | null;
declare function fetchControls(elements: HTMLElement | string | NodeList, identifier?: string): ControlBase[];
declare function dispatch(eventName: string, options?: { target?: Element | Window; detail?: unknown; bubbles?: boolean; cancelable?: boolean }): CustomEvent;
declare function trigger(target: Element, eventName: string, options?: CustomEventInit): CustomEvent;
declare function on(element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions): void;
declare function off(element: Element, event: string, handler?: EventListener, options?: EventListenerOptions): void;
declare function one(element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions): void;
declare function waitFor(predicate: () => boolean, timeout?: number): Promise<void>;
declare function domReady(): Promise<void>;
declare function pageReady(): Promise<void>;

declare var progressBar: ProgressBarAccessor;

export {
    ajax,
    request,
    parseJSON,
    values,
    flashMsg,
    progressBar,
    useTurbo,
    visit,
    registerControl,
    importControl,
    observeControl,
    fetchControl,
    fetchControls,
    dispatch,
    trigger,
    on,
    off,
    one,
    waitFor,
    domReady,
    pageReady
};

// ============================================================================
// Classes
// ============================================================================

export class AjaxRequest {
    constructor(element: HTMLElement | null, handler: string, options?: RequestOptions);
    static send<T = DataResponse>(handler: string, options?: RequestOptions<T>): Promise<T>;
    static sendElement<T = DataResponse>(element: HTMLElement | string, handler: string, options?: RequestOptions<T>): Promise<T>;
}

export { ControlBase };

// ============================================================================
// Namespaces
// ============================================================================

export const AjaxFramework: AjaxFrameworkNamespace;
export const AjaxExtras: AjaxExtrasNamespace;
export const AjaxObserve: AjaxObserveNamespace;
export const AjaxTurbo: AjaxTurboNamespace;
export const Events: Events;
export const AssetManager: AssetManager;

// ============================================================================
// Global jax Object
// ============================================================================

export interface JaxObject {
    // Request
    AjaxRequest: typeof AjaxRequest;
    AssetManager: AssetManager;
    ajax: typeof ajax;

    // Framework
    AjaxFramework: AjaxFrameworkNamespace;
    request: typeof request;
    parseJSON: typeof parseJSON;
    values: typeof values;

    // Extras
    AjaxExtras: AjaxExtrasNamespace;
    flashMsg: typeof flashMsg;
    progressBar: ProgressBarAccessor;
    attachLoader: AjaxExtrasNamespace['attachLoader'];

    // Observe
    AjaxObserve: AjaxObserveNamespace;
    ControlBase: typeof ControlBase;
    registerControl: typeof registerControl;
    importControl: typeof importControl;
    observeControl: typeof observeControl;
    fetchControl: typeof fetchControl;
    fetchControls: typeof fetchControls;

    // Turbo
    AjaxTurbo: AjaxTurboNamespace;
    useTurbo: typeof useTurbo;
    visit: typeof visit;

    // Events
    Events: Events;
    dispatch: typeof dispatch;
    trigger: typeof trigger;
    on: typeof on;
    off: typeof off;
    one: typeof one;
    waitFor: typeof waitFor;
    pageReady: typeof pageReady;

    // Initialization
    start(): void;
}

export const jax: JaxObject;

// ============================================================================
// Global Declarations
// ============================================================================

declare global {
    interface Window {
        jax: JaxObject;
    }

    interface GlobalEventHandlersEventMap {
        'ajax:before-send': AjaxBeforeSendEvent;
        'ajax:before-request': AjaxSetupEvent;
        'ajax:before-update': AjaxBeforeUpdateEvent;
        'ajax:before-validate': AjaxBeforeValidateEvent;
        'ajax:before-replace': AjaxBeforeReplaceEvent;
        'ajax:before-redirect': CustomEvent;
        'ajax:update': AjaxUpdateEvent;
        'ajax:update-complete': AjaxUpdateCompleteEvent;
        'ajax:send-complete': AjaxUpdateEvent;
        'ajax:request-success': AjaxRequestSuccessEvent;
        'ajax:request-error': AjaxRequestErrorEvent;
        'ajax:request-complete': AjaxRequestResponseEvent;
        'ajax:request-start': AjaxRequestStartEvent;
        'ajax:request-end': AjaxRequestEndEvent;
        'ajax:error-message': AjaxErrorMessageEvent;
        'ajax:confirm-message': AjaxConfirmMessageEvent;
        'ajax:setup': AjaxSetupEvent;
        'ajax:promise': AjaxPromiseEvent;
        'ajax:fail': AjaxFailEvent;
        'ajax:done': AjaxDoneEvent;
        'ajax:always': AjaxAlwaysEvent;
        'ajax:invalid-field': AjaxInvalidFieldEvent;
        'page:click': PageClickEvent;
        'page:before-visit': PageBeforeVisitEvent;
        'page:visit': PageVisitEvent;
        'page:before-cache': CustomEvent;
        'page:before-render': PageBeforeRenderEvent;
        'page:render': CustomEvent;
        'page:load': PageLoadEvent;
        'page:loaded': CustomEvent;
        'page:updated': CustomEvent;
        'page:unload': CustomEvent;
    }
}
