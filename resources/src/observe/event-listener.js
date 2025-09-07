export class EventListener
{
    constructor(eventTarget, eventName, eventOptions) {
        this.eventTarget = eventTarget;
        this.eventName = eventName;
        this.eventOptions = eventOptions;
        this.unorderedBindings = new Set();
    }

    connect() {
        this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
    }

    disconnect() {
        this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
    }

    // Binding observer delegate
    bindingConnected(binding) {
        this.unorderedBindings.add(binding);
    }

    bindingDisconnected(binding) {
        this.unorderedBindings.delete(binding);
    }

    handleEvent(event) {
        const extendedEvent = extendEvent(event);
        for (const binding of this.bindings) {
            if (extendedEvent.immediatePropagationStopped) {
                break;
            }
            else {
                binding.handleEvent(extendedEvent);
            }
        }
    }

    hasBindings() {
        return this.unorderedBindings.size > 0;
    }

    get bindings() {
        return Array.from(this.unorderedBindings).sort((left, right) => {
            const leftIndex = left.index, rightIndex = right.index;
            return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
        });
    }
}

function extendEvent(event) {
    if ('immediatePropagationStopped' in event) {
        return event;
    }
    else {
        const { stopImmediatePropagation } = event;
        return Object.assign(event, {
            immediatePropagationStopped: false,
            stopImmediatePropagation() {
                this.immediatePropagationStopped = true;
                stopImmediatePropagation.call(this);
            },
        });
    }
}
