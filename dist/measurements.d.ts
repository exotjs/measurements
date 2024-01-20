import type { ExportOptions, MeasurementConfig, MeasurementExported, Init, Store } from './types.js';
export declare class Measurements {
    #private;
    readonly init: Init;
    readonly store: Store;
    readonly currentMeasurements: Map<string, {
        measurement: MeasurementBase;
        time: number;
    }>;
    readonly measurements: Map<string, MeasurementConfig>;
    constructor(init: Init, store: Store);
    getMeasurementConfig(key: string): MeasurementConfig;
    reset(): void;
    rountTime(time: number, interval: number): number;
    downsample<T>(key: string, measurements: [number, string, T][], interval: number): [number, string, T][];
    fill<T>(key: string, measurements: [number, string, T][], startTime: number, endTime: number, interval: number): [number, string, T][];
    export<T>(options?: ExportOptions): Promise<MeasurementExported<T>[]>;
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
        count: number;
        min: null | number;
        max: null | number;
        sum: number;
    };
    push(value: number | number[] | NumberMeasurement['value']): void;
}
