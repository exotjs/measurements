import { EventEmitter } from 'node:events';
import { trimNumber } from '../helpers.js';
import type { MeasurementConfig } from '../types.js';

export abstract class BaseMeasurement<T = any> extends EventEmitter {
  #flushTimeout?: NodeJS.Timeout;

  destroyed: boolean = false;

  value!: T;

  constructor(
    readonly config: MeasurementConfig,
    readonly time: number,
    readonly label: string = '',
  ) {
    super();
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

  deflate(): any {
    return typeof this.value === 'number' ? trimNumber(this.value, this.config.decimals) : this.value;
  }

  inflate(value: any): T {
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
    } else {
      this.emitFlushEvent();
    }
  }

  emitFlushEvent() {
    this.emit('flush', this.value, this.time, this.config);
  }

  push(value: T) {
    this.value = value;
    this.flush();
  };
}
