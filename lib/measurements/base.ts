import { trimNumber } from '../helpers.js';
import type { MeasurementConfig } from '../types.js';

export abstract class BaseMeasurement<T = unknown> {
  #flushTimeout?: NodeJS.Timeout;

  #onFlush?: (value: T, time: number, config: MeasurementConfig) => void;

  destroyed: boolean = false;

  value!: T;

  constructor(
    readonly config: MeasurementConfig,
    readonly time: number,
    readonly label: string = ''
  ) {}

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
    this.value = void 0 as T;
    this.destroyed = true;
  }

  deflate(): unknown {
    return typeof this.value === 'number'
      ? trimNumber(this.value, this.config.decimals)
      : this.value;
  }

  inflate(value: unknown): T {
    return value as T;
  }

  flush() {
    if (this.config.flushDelay) {
      if (!this.#flushTimeout) {
        this.#flushTimeout = setTimeout(() => {
          this.#flushTimeout = void 0;
          this.#triggerFlush();
        }, this.config.flushDelay);
      }
    } else {
      this.#triggerFlush();
    }
  }

  onFlush(fn: (value: T, time: number, config: MeasurementConfig) => void) {
    this.#onFlush = fn;
  }

  push(value: T) {
    this.value = value;
    this.flush();
  }
}
