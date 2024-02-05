import { trimNumber } from '../helpers.js';
export class BaseMeasurement {
    config;
    time;
    label;
    #flushTimeout;
    #onFlush;
    destroyed = false;
    value;
    constructor(config, time, label = '') {
        this.config = config;
        this.time = time;
        this.label = label;
    }
    #triggerFlush() {
        if (this.#onFlush) {
            this.#onFlush(this.value, this.time, this.config);
        }
    }
    destroy() {
        if (this.#flushTimeout) {
            clearInterval(this.#flushTimeout);
            this.#flushTimeout = void 0;
            this.#triggerFlush();
        }
        this.#onFlush = void 0;
        // @ts-expect-error
        this.value = void 0;
        this.destroyed = true;
    }
    deflate() {
        return typeof this.value === 'number' ? trimNumber(this.value, this.config.decimals) : this.value;
    }
    inflate(value) {
        return value;
    }
    flush() {
        if (this.config.flushDelay) {
            if (!this.#flushTimeout) {
                this.#flushTimeout = setTimeout(() => {
                    this.#flushTimeout = void 0;
                    this.#triggerFlush();
                }, this.config.flushDelay);
            }
        }
        else {
            this.#triggerFlush();
        }
    }
    onFlush(fn) {
        this.#onFlush = fn;
    }
    push(value) {
        this.value = value;
        this.flush();
    }
    ;
}
