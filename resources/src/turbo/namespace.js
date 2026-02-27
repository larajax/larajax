import { Controller } from "./controller";
const controller = new Controller;

export default {
    get supported() {
        return Controller.supported;
    },

    controller,

    visit(location, options) {
        if (controller.isEnabled()) {
            controller.visit(location, options);
        }
        else {
            window.location.assign(location);
        }
    },

    setProgressBarVisible(value) {
        controller.setProgressBarVisible(value);
    },

    setProgressBarDelay(delay) {
        controller.setProgressBarDelay(delay);
    },

    start() {
        controller.start();
    },

    isEnabled() {
        return controller.isEnabled();
    },

    pageReady() {
        return controller.pageReady();
    }
};
