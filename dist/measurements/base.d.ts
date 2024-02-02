/// <reference types="node" />
import { EventEmitter } from 'node:events';
import type { MeasurementConfig } from '../types.js';
export declare abstract class BaseMeasurement<T = any> extends EventEmitter {
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
    emitFlushEvent(): void;
    push(value: T): void;
}
