import { MemoryStorage } from './storage.js';
import type { ExportOptions, MeasurementConfig, MeasurementExported, Init } from './types.js';
export declare class Measurements {
    #private;
    readonly init: Init;
    readonly measurements: Map<string, {
        config: MeasurementConfig;
        current?: MeasurementBase;
        time: number;
    }>;
    readonly storage: MemoryStorage;
    constructor(init: Init);
    downsample<T>(measurements: [number, T][], interval: number): [number, T][];
    export(options?: ExportOptions): Promise<MeasurementExported[]>;
    import(measurements: MeasurementExported[]): Promise<void>;
    push(metrics: Record<string, number[]>): void;
    counter(key: string, time?: number): CounterMeasurement;
    number(key: string, time?: number): NumberMeasurement;
    value(key: string, time?: number): ValueMeasurement;
}
export declare abstract class MeasurementBase<T = any> {
    value: T;
    push(value: T): void;
}
export declare class ValueMeasurement extends MeasurementBase {
    value: number;
    push(value: number): void;
}
export declare class CounterMeasurement extends MeasurementBase {
    value: number;
    push(value?: number): void;
}
export declare class NumberMeasurement extends MeasurementBase {
    value: {
        avg: null | number;
        min: null | number;
        max: null | number;
        samples: number;
        sum: number;
    };
    push(value: number | number[] | NumberMeasurement['value']): void;
}
