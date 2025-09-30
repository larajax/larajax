
export class Migrate
{
    bind() {
        if ($.oc === undefined) {
            $.oc = {};
        }

        $.oc.flashMsg = window.jax.flashMsg;
        $.oc.stripeLoadIndicator = window.jax.progressBar;
    }
}
