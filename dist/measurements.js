import { MemoryStorage } from './storage.js';
export class Measurements {
    init;
    measurements = new Map();
    storage = new MemoryStorage();
    constructor(init) {
        this.init = init;
        for (let config of init.measurements) {
            this.measurements.set(config.key, {
                config,
                time: 0,
            });
        }
    }
    downsample(measurements, interval) {
        const result = [];
        for (let [time, value] of measurements) {
            time = Math.floor(time / interval) * interval;
            let target = result.find((item) => item[0] === time)?.[1];
            /*
            if (!target) {
              target = this.#createMeasurement(measurement);
              result.push([time, target]);
            }
            target.push(value);
            */
        }
        return result;
    }
    async export(options = {}) {
        const endTime = options.endTime || Date.now();
        const startTime = options.startTime || 0;
        const data = [];
        for (let [key, { config, current, time }] of this.measurements.entries()) {
            if (!options.keys?.length || options.keys.includes(key)) {
                let measurements = await this.storage.range(key, startTime, endTime);
                if (current && time >= startTime && time < endTime) {
                    measurements.push([time, current.value]);
                }
                if (options.downsample) {
                    // measurements = this.downsample(measurements, options.downsample);
                }
                data.push({
                    config: {
                        ...config,
                        interval: options.downsample || config.interval,
                    },
                    measurements,
                });
            }
        }
        return data;
    }
    async import(measurements) {
        for (let measurement of measurements) {
            const key = measurement.config.key;
            if (!this.measurements.has(key)) {
                this.measurements.set(key, {
                    config: measurement.config,
                    time: 0,
                });
            }
            const { config } = this.measurements.get(key);
            for (let [time, value] of measurement.measurements) {
                time = Math.floor(time / config.interval) * config.interval;
                const m = this.#createMeasurement(config.type);
                m.value = value;
                this.storage.put(key, time, m);
            }
        }
    }
    push(metrics) {
        for (let key in metrics) {
            const values = metrics[key];
            const { config } = this.measurements.get(key);
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
    counter(key, time) {
        return this.#getCurrentMeasurement(key, time);
    }
    number(key, time) {
        return this.#getCurrentMeasurement(key, time);
    }
    value(key, time) {
        return this.#getCurrentMeasurement(key, time);
    }
    #createMeasurement(type) {
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
    #getCurrentMeasurement(key, time = Date.now()) {
        let measurement = this.measurements.get(key);
        if (!measurement) {
            throw new Error('Unknown measurement');
        }
        const { config } = measurement;
        time = Math.floor(time / config.interval) * config.interval;
        if (!measurement.current || measurement.time < time) {
            if (measurement.current) {
                this.storage.put(key, measurement.time, measurement.current.value)
                    .catch(() => {
                    // TODO:
                });
            }
            measurement.current = this.#createMeasurement(config.type);
            measurement.time = time;
        }
        return measurement.current;
    }
}
export class MeasurementBase {
    value;
    push(value) {
        this.value = value;
    }
    ;
}
export class ValueMeasurement extends MeasurementBase {
    value = 0;
    push(value) {
        this.value = value;
    }
}
export class CounterMeasurement extends MeasurementBase {
    value = 0;
    push(value = 1) {
        this.value = this.value + value;
    }
}
export class NumberMeasurement extends MeasurementBase {
    value = {
        avg: null,
        min: null,
        max: null,
        samples: 0,
        sum: 0,
    };
    push(value) {
        if (Array.isArray(value)) {
            value.map((v) => this.push(v));
            return;
        }
        else if (typeof value === 'number') {
            this.push({
                avg: null,
                min: value,
                max: value,
                samples: 1,
                sum: value,
            });
        }
        else {
            if (value.max !== null && (this.value.max === null || value.max > this.value.max)) {
                this.value.max = value.max;
            }
            if (value.min !== null && (this.value.min === null || value.min > this.value.min)) {
                this.value.min = value.max;
            }
            this.value.sum = this.value.sum + value.sum;
            this.value.samples = this.value.samples + value.samples;
            this.value.avg = Math.floor((this.value.sum / this.value.samples) * 10000) / 10000;
        }
    }
}
