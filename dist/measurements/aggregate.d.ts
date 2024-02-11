import { BaseMeasurement } from './base.js';
export declare class AggregateMeasurement extends BaseMeasurement {
    value: {
        avg: null | number;
        count: number;
        first: null | number;
        last: null | number;
        min: null | number;
        max: null | number;
        sum: number;
    };
    deflate(): (number | null)[];
    inflate(value: (number | null)[]): {
        avg: number | null;
        count: number | null;
        first: number | null;
        last: number | null;
        min: number | null;
        max: number | null;
        sum: number | null;
    };
    push(value: number | number[] | AggregateMeasurement['value']): void;
}
