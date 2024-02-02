import { EventEmitter } from 'node:events';
import { trimNumber } from '../helpers.js';
export class BaseMeasurement extends EventEmitter {
    config;
    time;
    label;
    #flushTimeout;
    destroyed = false;
    value;
    constructor(config, time, label = '') {
        super();
        this.config = config;
        this.time = time;
        this.label = label;
    }
    destroy() {
        if (this.#flushTimeout) {
            clearInterval(this.#flushTimeout);
            this.#flushTimeout = void 0;
            this.emitFlushEvent();
        }
        this.removeAllListeners();
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
                    this.emitFlushEvent();
                }, this.config.flushDelay);
            }
        }
        else {
            this.emitFlushEvent();
        }
    }
    emitFlushEvent() {
        this.emit('flush', this.value, this.time, this.config);
    }
    push(value) {
        this.value = value;
        this.flush();
    }
    ;
}
