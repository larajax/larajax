import { Application } from "./application";
const application = new Application;

export default {
    application,

    registerControl(id, control) {
        return application.register(id, control);
    },

    importControl(id) {
        return application.import(id);
    },

    observeControl(element, id) {
        return application.observe(element, id);
    },

    fetchControl(element) {
        return application.fetch(element);
    },

    fetchControls(elements) {
        return application.fetchAll(elements);
    },

    start() {
        application.startAsync();
    },

    stop() {
        application.stop();
    }
};
