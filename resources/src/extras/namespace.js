import { Controller } from "./controller";
import { FlashMessage } from "./flash-message";
import { ProgressBar } from "./progress-bar";
import { AttachLoader } from "./attach-loader";
const controller = new Controller;

export default {
    controller,

    flashMsg: FlashMessage.flashMsg,

    progressBar: ProgressBar.progressBar,

    attachLoader: AttachLoader.attachLoader,

    start() {
        controller.start();
    },

    stop() {
        controller.stop();
    }
};
