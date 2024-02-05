import type { MeasurementConfig } from '../types.js';
export declare abstract class BaseMeasurement<T = any> {
    #private;
    readonly config: MeasurementConfig;
    readonly time: number;
    readonly label: string;
    destroyed: boolean;
    value: T;
    constructor(config: MeasurementConfig, time: number, label?: string);
    destroy(): void;
    deflate(): any;
    inflate(value: any): T;
    flush(): void;
    onFlush(fn: (value: T, time: number, config: MeasurementConfig) => void): void;
    push(value: T): void;
}
