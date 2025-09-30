export class ScrollManager
{
    constructor(delegate) {
        this.started = false;
        this.onScroll = () => {
            this.updatePosition({ x: window.pageXOffset, y: window.pageYOffset });
        };
        this.delegate = delegate;
    }

    start() {
        if (!this.started) {
            addEventListener('scroll', this.onScroll, false);
            this.onScroll();
            this.started = true;
        }
    }

    stop() {
        if (this.started) {
            removeEventListener('scroll', this.onScroll, false);
            this.started = false;
        }
    }

    scrollToElement(element) {
        element.scrollIntoView();
    }

    scrollToPosition({ x, y }) {
        window.scrollTo(x, y);
    }

    // Private
    updatePosition(position) {
        this.delegate.scrollPositionChanged(position);
    }
}
