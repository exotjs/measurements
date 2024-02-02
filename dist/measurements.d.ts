import { AggregateMeasurement } from './measurements/aggregate.js';
import { BaseMeasurement } from './measurements/base.js';
import { SumMeasurement } from './measurements/sum.js';
import { ValueMeasurement } from './measurements/value.js';
import type { ExportOptions, MeasurementConfig, MeasurementExported, Init, Store } from './types.js';
export declare class Measurements {
    #private;
    static createMeasurement(config: MeasurementConfig, time: number, label: string): AggregateMeasurement | SumMeasurement | ValueMeasurement;
    static downsample<T>(exported: MeasurementExported[], interval: number): {
        config: {
            interval: number;
            decimals?: number | undefined;
            flushDelay?: number | undefined;
            label?: string | undefined;
            key: string;
            type: "aggregate" | "sum" | "value";
            sensor?: string | undefined;
        };
        measurements: [number, string, T][];
    }[];
    static fill<T>(exported: MeasurementExported[], startTime: number, endTime: number): {
        config: MeasurementConfig;
        measurements: [number, string, T][];
    }[];
    readonly currentMeasurements: Map<string, Map<string, {
        label: string;
        measurement: BaseMeasurement;
        time: number;
    }>>;
    readonly init: Init;
    readonly measurements: Map<string, MeasurementConfig>;
    readonly store: Store;
    constructor(init: Init);
    getMeasurementConfig(key: string): MeasurementConfig;
    onError(err: any): void;
    destroy(): void;
    reset(): void;
    export<T>(options?: ExportOptions): Promise<MeasurementExported<T>[]>;
    import(measurements: MeasurementExported[]): Promise<void>;
    push(data: Record<string, {
        label?: string;
        values: number[];
    }[]>): void;
    aggregate(key: string, time?: number, label?: string): AggregateMeasurement;
    sum(key: string, time?: number, label?: string): SumMeasurement;
    value(key: string, time?: number, label?: string): ValueMeasurement;
}
