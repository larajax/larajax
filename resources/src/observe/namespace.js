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

    fetchControl(element, identifier) {
        return application.fetch(element, identifier);
    },

    fetchControls(elements, identifier) {
        return application.fetchAll(elements, identifier);
    },

    start() {
        application.startAsync();
    },

    stop() {
        application.stop();
    }
};
