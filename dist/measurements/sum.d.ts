import { BaseMeasurement } from './base.js';
export declare class SumMeasurement extends BaseMeasurement {
    value: number;
    push(value: number | number[]): void;
}
