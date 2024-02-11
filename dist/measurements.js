import { AggregateMeasurement } from './measurements/aggregate.js';
import { SumMeasurement } from './measurements/sum.js';
import { ValueMeasurement } from './measurements/value.js';
import { roundTime } from './helpers.js';
import { MemoryStore } from './store.js';
const DEFAULT_EXPORT_DURATION = 60000 * 15;
export class Measurements {
    static createMeasurement(config, time = 0, label = '') {
        switch (config.type) {
            case 'aggregate':
                return new AggregateMeasurement(config, time, label);
            case 'sum':
                return new SumMeasurement(config, time, label);
            case 'value':
                return new ValueMeasurement(config, time, label);
            default:
                throw new Error('Unknown measurement type');
        }
    }
    static downsample(exported, downsampleInterval) {
        return exported.map(({ config, measurements }) => {
            const result = [];
            const interval = downsampleInterval || config.interval;
            for (let [time, label, value] of measurements) {
                time = roundTime(time, interval);
                let target = result.find((item) => item[0] === time && item[1] === label)?.[2];
                if (!target) {
                    target = this.createMeasurement(config, time, label);
                    result.push([time, label, target]);
                }
                target.push(target.inflate(value));
            }
            return {
                config: {
                    ...config,
                    interval,
                },
                measurements: result.map(([time, label, measurement]) => [
                    time,
                    label,
                    measurement.deflate(),
                ]),
            };
        });
    }
    static fill(exported, startTime, endTime, fillInterval) {
        return exported.map(({ config, measurements }) => {
            const label = config.label || '';
            const interval = fillInterval || config.interval;
            startTime = roundTime(startTime, interval);
            endTime = roundTime(endTime, interval);
            const len = Math.ceil((endTime - startTime) / interval);
            const result = [];
            for (let i = 0; i <= len; i++) {
                const time = startTime + i * interval;
                const measurement = measurements.find((item) => item[0] === time);
                if (!measurement && i === len) {
                    break;
                }
                let value = measurement?.[2];
                if (value === void 0) {
                    const nulled = this.createMeasurement(config, time, label);
                    value = nulled.deflate();
                }
                result.push([time, label, value]);
            }
            return {
                config,
                measurements: result,
            };
        });
    }
    currentMeasurements = new Map();
    init;
    measurements = new Map();
    store;
    constructor(init) {
        const { measurements, onError, store } = init;
        this.init = {
            measurements,
            onError,
            store,
        };
        this.store = store || new MemoryStore();
        for (let measurement of this.init.measurements) {
            this.measurements.set(measurement.key, measurement);
        }
    }
    getMeasurementConfig(key) {
        const config = this.measurements.get(key);
        if (!config) {
            throw new Error('Unknown measurement ' + key);
        }
        return config;
    }
    onError(err) {
        if (this.init.onError) {
            this.init.onError(err);
        }
    }
    async destroy() {
        this.reset();
        this.store.destroy();
    }
    async reset() {
        for (let [_, map] of this.currentMeasurements) {
            for (let [__, { measurement }] of map) {
                measurement.destroy();
            }
        }
        await this.store.clear();
        this.currentMeasurements.clear();
        this.measurements.clear();
        for (let measurement of this.init.measurements) {
            this.measurements.set(measurement.key, measurement);
        }
    }
    async export(options = {}) {
        const endTime = options.endTime || Date.now();
        const startTime = options.startTime || endTime - DEFAULT_EXPORT_DURATION;
        const duration = endTime - startTime;
        if (duration <= 0) {
            throw new Error('Invalid time span.');
        }
        const filterKeys = options.keys?.map((key) => key.includes('*') ? new RegExp(key.replace(/\*/g, '[^\\:\\.]+')) : key);
        let data = [];
        for (let [key, config] of this.measurements.entries()) {
            if (!filterKeys?.length ||
                filterKeys.some((k) => (k instanceof RegExp ? k.test(key) : k === key))) {
                const map = this.currentMeasurements.get(config.key);
                const measurements = await this.store.setQuery(config.key, startTime, endTime);
                if (map) {
                    for (let [_label, current] of map) {
                        if (current &&
                            current.time >= roundTime(startTime, config.interval) &&
                            current.time < endTime) {
                            const value = current.measurement.deflate();
                            const exists = measurements.entries.find((entry) => entry[0] === current.time && entry[1] === current.label);
                            if (exists) {
                                exists[2] = value;
                            }
                            else {
                                measurements.entries.push([current.time, current.label, value]);
                            }
                        }
                    }
                }
                data.push({
                    config,
                    measurements: measurements.entries,
                });
            }
        }
        data = Measurements.downsample(data, options.downsample);
        if (options.fill) {
            data = Measurements.fill(data, startTime, endTime, options.downsample);
        }
        return data;
    }
    async import(measurements) {
        for (let measurement of measurements) {
            const config = measurement.config;
            const key = config.key;
            if (!this.measurements.has(key)) {
                this.measurements.set(key, config);
            }
            if (Array.isArray(measurement.measurements)) {
                for (let [time, label, value] of measurement.measurements) {
                    time = roundTime(time, config.interval);
                    await this.store.setAdd(key, time, label, value);
                }
            }
        }
    }
    push(data) {
        for (let key in data) {
            const records = data[key];
            const config = this.getMeasurementConfig(key);
            if (config) {
                for (let { label, values } of records) {
                    switch (config.type) {
                        case 'aggregate':
                            this.aggregate(key, void 0, label).push(values);
                            break;
                        case 'sum':
                            this.sum(key, void 0, label).push(values);
                            break;
                        case 'value':
                            this.value(key, void 0, label).push(values[values.length - 1]);
                            break;
                    }
                }
            }
        }
    }
    aggregate(key, time, label) {
        return this.#ensureCurrentMeasurement(key, time, label);
    }
    sum(key, time, label) {
        return this.#ensureCurrentMeasurement(key, time, label);
    }
    value(key, time, label) {
        return this.#ensureCurrentMeasurement(key, time, label);
    }
    #ensureCurrentMeasurement(key, time = Date.now(), label) {
        const config = this.getMeasurementConfig(key);
        time = roundTime(time, config.interval);
        label = (label === void 0 ? config.label : label) || '';
        let map = this.currentMeasurements.get(key);
        if (!map) {
            map = new Map();
            this.currentMeasurements.set(key, map);
        }
        const current = map.get(label);
        let measurement = current?.measurement;
        if (!current || current.time !== time) {
            if (current) {
                current.measurement.destroy();
            }
            measurement = Measurements.createMeasurement(config, time, label);
            measurement.onFlush(() => {
                if (measurement && !measurement.destroyed) {
                    this.store
                        .setAdd(measurement.config.key, measurement.time, measurement.label, measurement.deflate())
                        .catch((err) => {
                        this.onError(err);
                    });
                }
            });
            map.set(label, {
                label,
                measurement,
                time,
            });
        }
        return measurement;
    }
}
