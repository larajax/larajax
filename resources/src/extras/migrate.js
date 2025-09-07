
export class Migrate
{
    bind() {
        if ($.oc === undefined) {
            $.oc = {};
        }

        $.oc.flashMsg = window.oc.flashMsg;
        $.oc.stripeLoadIndicator = window.oc.progressBar;
    }
}
