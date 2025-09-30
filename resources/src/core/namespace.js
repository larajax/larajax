import { Controller } from "./controller";
import { Migrate } from "./migrate";
import { RequestBuilder } from "./request-builder";
import { JsonParser } from "../util/json-parser";
import { FormSerializer } from "../util/form-serializer";
const controller = new Controller;

export default {
    controller,

    parseJSON: JsonParser.parseJSON,

    serializeJSON: FormSerializer.serializeJSON,

    requestElement: RequestBuilder.fromElement,

    start() {
        controller.start();

        if (window.jQuery) {
            (new Migrate).bind();
        }
    },

    stop() {
        controller.stop();
    }
};
