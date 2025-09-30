import { Validator } from "./validator";
import { AttachLoader } from "./attach-loader";
import { FlashMessage } from "./flash-message";
import { Events } from "../util/events";
import { getReferrerUrl } from "../util/referrer";

export class Controller
{
    constructor() {
        this.started = false;

        // Progress bar default value
        this.enableProgressBar = function(event) {
            const { options } = event.detail.context;
            if (options.progressBar === null) {
                options.progressBar = true;
            }
        }

        // Attach loader
        this.showAttachLoader = (event) => {
            this.attachLoader.showForm(event.target);
        };

        this.hideAttachLoader = (event) => {
            this.attachLoader.hideForm(event.target);
        };

        this.hideAllAttachLoaders = (event) => {
            this.attachLoader.hideAll();
        };

        // Validator
        this.validatorSubmit = (event) => {
            this.validator.submit(event.target);
        };

        this.validatorValidate = (event) => {
            this.validator.validate(
                event.target,
                event.detail.fields,
                event.detail.message,
                shouldShowFlashMessage(event.detail.context.options.flash, 'validate')
            );
        };

        // Flash message
        this.flashMessageBind = (event) => {
            const { options } = event.detail.context;
            if (options.flash) {
                options.handleErrorMessage = (message) => {
                    if (
                        message &&
                        shouldShowFlashMessage(options.flash, 'error') ||
                        shouldShowFlashMessage(options.flash, 'validate')
                    ) {
                        this.flashMessage.show({ message, type: 'error' });
                    }
                }

                options.handleFlashMessage = (message, type) => {
                    if (message && shouldShowFlashMessage(options.flash, type)) {
                        this.flashMessage.show({ message, type });
                    }
                }
            }

            var context = event.detail;
            options.handleProgressMessage = (message, isDone) => {
                if (!isDone) {
                    context.progressMessageId = this.flashMessage.show({ message, type: 'loading', interval: 10 });
                }
                else {
                    this.flashMessage.show(context.progressMessageId
                        ? { replace: context.progressMessageId }
                        : { hideAll: true });

                    context = null;
                }
            }
        };

        this.flashMessageRender = (event) => {
            this.flashMessage.render();
        };

        this.hideAllFlashMessages = (event) => {
            this.flashMessage.hideAll();
        };

        // Browser redirect
        this.handleBrowserRedirect = function(event) {
            if (event.defaultPrevented) {
                return;
            }

            const href = getReferrerUrl();
            if (!href) {
                return;
            }

            event.preventDefault();
            if (jax.useTurbo && jax.useTurbo()) {
                jax.visit(href);
            }
            else {
                location.assign(href);
            }
        };
    }

    start() {
        if (!this.started) {
            // Progress bar
            addEventListener('ajax:setup', this.enableProgressBar);

            // Attach loader
            this.attachLoader = new AttachLoader;
            Events.on(document, 'ajax:promise', 'form, [data-attach-loading]', this.showAttachLoader);
            Events.on(document, 'ajax:fail', 'form, [data-attach-loading]', this.hideAttachLoader);
            Events.on(document, 'ajax:done', 'form, [data-attach-loading]', this.hideAttachLoader);
            addEventListener('page:before-cache', this.hideAllAttachLoaders);

            // Validator
            this.validator = new Validator;
            Events.on(document, 'ajax:before-validate', '[data-request-validate]', this.validatorValidate);
            Events.on(document, 'ajax:promise', '[data-request-validate]', this.validatorSubmit);

            // Flash message
            this.flashMessage = new FlashMessage;
            addEventListener('render', this.flashMessageRender);
            addEventListener('ajax:setup', this.flashMessageBind);
            addEventListener('page:before-cache', this.hideAllFlashMessages);

            // Browser redirect
            Events.on(document, 'click', '[data-browser-redirect-back]', this.handleBrowserRedirect);

            this.started = true;
        }
    }

    stop() {
        if (this.started) {
            // Progress bar
            removeEventListener('ajax:setup', this.enableProgressBar);

            // Attach loader
            this.attachLoader = null;
            Events.off(document, 'ajax:promise', 'form, [data-attach-loading]', this.showAttachLoader);
            Events.off(document, 'ajax:fail', 'form, [data-attach-loading]', this.hideAttachLoader);
            Events.off(document, 'ajax:done', 'form, [data-attach-loading]', this.hideAttachLoader);
            removeEventListener('page:before-cache', this.hideAllAttachLoaders);

            // Validator
            this.validator = null;
            Events.off(document, 'ajax:before-validate', '[data-request-validate]', this.validatorValidate);
            Events.off(document, 'ajax:promise', '[data-request-validate]', this.validatorSubmit);

            // Flash message
            this.flashMessage = null;
            removeEventListener('render', this.flashMessageRender);
            removeEventListener('ajax:setup', this.flashMessageBind);
            removeEventListener('page:before-cache', this.hideAllFlashMessages);

            // Browser redirect
            Events.off(document, 'click', '[data-browser-redirect-back]', this.handleBrowserRedirect);

            this.started = false;
        }
    }
}

function shouldShowFlashMessage(value, type) {
    // Validation messages are not included by default
    if (value === true && type !== 'validate') {
        return true;
    }

    if (typeof value !== 'string') {
        return false;
    }

    if (value === '*') {
        return true;
    }

    let result = false;
    value.split(',').forEach(function(validType) {
        if (validType.trim() === type) {
            result = true;
        }
    });

    return result;
}
