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
    inflate(value: any): {
        avg: any;
        count: any;
        first: any;
        last: any;
        min: any;
        max: any;
        sum: any;
    };
    push(value: number | number[] | AggregateMeasurement['value']): void;
}
