import type { ExportOptions, MeasurementConfig, MeasurementExported, Init, Store } from './types.js';

export class Measurements {
  readonly currentMeasurements: Map<string, {
    measurement: MeasurementBase;
    time: number;
  }> = new Map();

  readonly measurements: Map<string, MeasurementConfig> = new Map();

  constructor(readonly init: Init, readonly store: Store) {
    this.reset();
  }

  getMeasurementConfig(key: string) {
    const config = this.measurements.get(key);
    if (!config) {
      throw new Error('Unknown measurement ' + key);
    }
    return config;
  }

  reset() {
    this.currentMeasurements.clear();
    this.measurements.clear();
    for (let measurement of this.init.measurements) {
      this.measurements.set(measurement.key, measurement);
    }
  }

  rountTime(time: number, interval: number) {
    return Math.floor(time / interval) * interval;
  }

  downsample<T>(key: string, measurements: [number, string, T][], interval: number) {
    const config = this.getMeasurementConfig(key);
    const result: [number, string, MeasurementBase][] = [];
    for (let [ time, label, value ] of measurements) {
      time = this.rountTime(time, interval);
      let target = result.find((item) => item[0] === time)?.[2];
      if (!target) {
        target = this.#createMeasurement(config.type); 
        result.push([time, label, target]);
      }
      target.push(value);
    }
    return result.map(([ time, label, measurement ]) => [time, label, measurement.value]) as [number, string, T][];
  }

  fill<T>(key: string, measurements: [number, string, T][], startTime: number, endTime: number, interval: number) {
    const config = this.getMeasurementConfig(key);
    startTime = this.rountTime(startTime, interval);
    endTime = this.rountTime(endTime, interval);
    const len = Math.ceil((endTime - startTime) / interval);
    const result: [number, string, T][] = [];
    for (let i = 0; i <= len; i ++) {
      const time = startTime + (i * interval);
      const measurement = measurements.find((item) => item[0] === time);
      if (!measurement && i === len) {
        break;
      }
      result.push([time, '', measurement?.[2] || this.#createMeasurement(config.type).value as T]);
    }
    return result;
  }

  async export<T>(options: ExportOptions = {}): Promise<MeasurementExported<T>[]> {
    const endTime = options.endTime || Date.now();
    const startTime = options.startTime || 0;
    const data: MeasurementExported[] = [];
    for (let [ key, config ] of this.measurements.entries()) {
      if (!options.keys?.length || options.keys.includes(config.key)) {
        const current = this.currentMeasurements.get(config.key);
        const interval = options.downsample || config.interval;
        let measurements = await this.store.query(config.key, startTime, endTime);
        if (current && current.time >= this.rountTime(startTime, config.interval) && current.time < endTime) {
          measurements.entries.push([current.time, '', current.measurement.value]);
        }
        if (options.downsample) {
          measurements.entries = this.downsample(key, measurements.entries, interval);
        }
        data.push({
          config: {
            ...config,
            interval,
          },
          measurements: options.fill && startTime ? this.fill(key, measurements.entries, startTime, endTime, interval) : measurements.entries,
        });
      }
    }
    return data;
  }

  async import(measurements: MeasurementExported[]) {
    for (let measurement of measurements) {
      const config = measurement.config;
      const key = config.key;
      if (!this.measurements.has(key)) {
        this.measurements.set(key, config);
      }
      if (Array.isArray(measurement.measurements)) {
        for (let [ time, label, value ] of measurement.measurements) {
          time = Math.floor(time / config.interval) * config.interval;
          this.store.set(key, [time, label, value]);
        }
      }
    }
  }

  push(metrics: Record<string, number[]>) {
    for (let key in metrics) {
      const values = metrics[key];
      const config = this.getMeasurementConfig(key);
      if (config) {
        switch (config.type) {
          case 'counter':
            const counter = this.counter(key);
            for (let value of values) {
              counter.push(value);
            }
            break;
          case 'number':
            this.number(key).push(values);
            break;
          case 'value':
            this.value(key).push(values[values.length - 1]);
            break;
        }
      }
    }
  }

  counter(key: string, time?: number) {
    return this.#ensureCurrentMeasurement(key, time) as CounterMeasurement;
  }

  number(key: string, time?: number) {
    return this.#ensureCurrentMeasurement(key, time) as NumberMeasurement;
  }

  value(key: string, time?: number) {
    return this.#ensureCurrentMeasurement(key, time) as ValueMeasurement;
  }

  #createMeasurement(type: string | MeasurementBase) {
    if (type instanceof CounterMeasurement) {
      return new CounterMeasurement();
    }
    if (type instanceof NumberMeasurement) {
      return new NumberMeasurement();
    }
    if (type instanceof ValueMeasurement) {
      return new ValueMeasurement();
    }
    switch (type) {
      case 'counter':
        return new CounterMeasurement();
      case 'number':
        return new NumberMeasurement();
      case 'value':
        return new ValueMeasurement();
      default:
        throw new Error('Unknown measurement type');
    }
  }

  #ensureCurrentMeasurement(key: string, time: number = Date.now()) {
    const config = this.getMeasurementConfig(key);
    time = this.rountTime(time, config.interval);
    const current = this.currentMeasurements.get(key);
    if (current && current.time !== time) {
      this.store.set(key, [current.time, '', current.measurement.value])
        .catch(() => {
          // TODO:
        });
    }
    if (!current || current.time !== time) {
      this.currentMeasurements.set(key, {
        measurement: this.#createMeasurement(config.type),
        time,
      });
    }
    return this.currentMeasurements.get(key)!.measurement;
  }
}

export abstract class MeasurementBase<T = any> {
  value!: T;

  push(value: T) {
    this.value = value;
  };
}

export class ValueMeasurement extends MeasurementBase {
  value = 0;

  push(value: number) {
    this.value = value;
  }
}

export class CounterMeasurement extends MeasurementBase {
  value = 0;

  push(value: number = 1) {
    this.value = this.value + value;
  }
}

export class NumberMeasurement extends MeasurementBase {
  value = {
    avg: null,
    count: 0,
    min: null,
    max: null,
    sum: 0,
  } as {
    avg: null | number;
    count: number;
    min: null | number;
    max: null | number;
    sum: number;
  };

  push(value: number | number[] | NumberMeasurement['value']) {
    if (Array.isArray(value)) {
      value.map((v) => this.push(v));
      return;
    } else if (typeof value === 'number') {
      this.push({
        avg: null,
        count: 1,
        min: value,
        max: value,
        sum: value,
      });
    } else {
      if (value.max !== null && (this.value.max === null || value.max > this.value.max)) {
        this.value.max = value.max;
      }
      if (value.min !== null && (this.value.min === null || value.min > this.value.min)) {
        this.value.min = value.max;
      }
      this.value.sum = this.value.sum + value.sum;
      this.value.count = this.value.count + value.count;
      this.value.avg = Math.floor((this.value.sum / this.value.count) * 10000) / 10000;
    }
  }
}
