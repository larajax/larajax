import { Controller } from "./controller";
import { RequestBuilder } from "./request-builder";
import { JsonParser } from "../util/json-parser";
import { FormSerializer } from "../util/form-serializer";
const controller = new Controller;

export default {
    controller,

    parseJSON: JsonParser.parseJSON,

    serializeAsJSON: FormSerializer.serializeAsJSON,

    requestElement: RequestBuilder.fromElement,

    pageReady() {
        return controller.pageReady();
    },

    start() {
        controller.start();
    },

    stop() {
        controller.stop();
    }
};
