export var DeferredState = {
    pending: 'pending',
    rejected: 'rejected',
    resolved: 'resolved'
}

export class Deferred
{
    constructor(options) {
        this.options = options || {};
        this.stateStr = DeferredState.pending;

        this.successFuncs = [];
        this.failureFuncs = [];
        this.progressFuncs = [];

        this.resolveArgs = [];
        this.rejectArgs = [];
        this.progressArgs = [];

        this.isProgressNotified = false;
    }

    // Public
    resolve() {
        if (this.stateStr === DeferredState.pending) {
            this.resolveArgs = arguments;
            this.callFunction.call(this, this.successFuncs, this.resolveArgs);
            this.stateStr = DeferredState.resolved;
        }

        return this;
    }

    reject() {
        if (this.stateStr === DeferredState.pending) {
            this.rejectArgs = arguments;
            this.callFunction.call(this, this.failureFuncs, this.rejectArgs);
            this.stateStr = DeferredState.rejected;
        }

        return this;
    }

    notify() {
        if (this.stateStr === DeferredState.pending) {
            this.progressArgs = arguments;
            this.callFunction.call(this, this.progressFuncs, this.progressArgs);
            this.isProgressNotified = true;
        }
        return this;
    }

    abort() {
        this.options.delegate && this.options.delegate.abort();
    }

    done() {
        var argumentsArray = Array.prototype.slice.call(arguments);
        this.successFuncs = this.successFuncs.concat(argumentsArray);

        if (this.stateStr === DeferredState.resolved) {
            this.callFunction.call(this, argumentsArray, this.resolveArgs);
        }

        return this;
    }

    fail() {
        var argumentsArray = Array.prototype.slice.call(arguments);
        this.failureFuncs = this.failureFuncs.concat(argumentsArray);

        if (this.stateStr === DeferredState.rejected) {
            this.callFunction.call(this, argumentsArray, this.rejectArgs);
        }

        return this;
    }

    progress() {
        var argumentsArray = Array.prototype.slice.call(arguments);
        this.progressFuncs = this.progressFuncs.concat(argumentsArray);

        if (this.stateStr === DeferredState.pending && this.isProgressNotified) {
            this.callFunction.call(this, argumentsArray, this.progressArgs);
        }

        return this;
    }

    always() {
        var argumentsArray = Array.prototype.slice.call(arguments);
        this.successFuncs = this.successFuncs.concat(argumentsArray);
        this.failureFuncs = this.failureFuncs.concat(argumentsArray);

        if (this.stateStr !== DeferredState.pending) {
            this.callFunction.call(this, argumentsArray, this.resolveArgs || this.rejectArgs);
        }

        return this;
    }

    then() {
        var tempArgs = [];
        for (var index in arguments) {
            var itemToPush;

            if (Array.isArray(arguments[index])) {
                itemToPush = arguments[index];
            }
            else {
                itemToPush = [arguments[index]];
            }

            tempArgs.push(itemToPush);
        }

        this.done.apply(this, tempArgs[0]);
        this.fail.apply(this, tempArgs[1]);
        this.progress.apply(this, tempArgs[2]);

        return this;
    }

    promise() {
        var protectedNames = ['resolve', 'reject', 'promise', 'notify'];
        var result = {};

        for (var key in this) {
            if (protectedNames.indexOf(key) === -1) {
                result[key] = this[key];
            }
        }

        return result;
    }

    state() {
        if (arguments.length > 0) {
            stateStr = arguments[0];
        }

        return stateStr;
    }

    // Private
    callFunction(functionDefinitionArray, functionArgumentArray, options) {
        options = options || {};
        var scope = options.scope || this;

        for (var index in functionDefinitionArray) {
            var item = functionDefinitionArray[index];
            if (typeof(item) === 'function') {
                item.apply(scope, functionArgumentArray);
            }
        }
    }
}
