import { trimNumber } from '../helpers.js';
import { BaseMeasurement } from './base.js';

export class AggregateMeasurement extends BaseMeasurement {
  value = {
    avg: null,
    count: 0,
    first: null,
    last: null,
    min: null,
    max: null,
    sum: 0,
  } as {
    avg: null | number;
    count: number;
    first: null | number;
    last: null | number;
    min: null | number;
    max: null | number;
    sum: number;
  };

  deflate(): (number | null)[] {
    return [
      this.value.first === null
        ? null
        : trimNumber(this.value.first, this.config.decimals),
      this.value.last === null
        ? null
        : trimNumber(this.value.last, this.config.decimals),
      this.value.count === null
        ? null
        : trimNumber(this.value.count, this.config.decimals),
      this.value.sum === null
        ? null
        : trimNumber(this.value.sum, this.config.decimals),
      this.value.min === null
        ? null
        : trimNumber(this.value.min, this.config.decimals),
      this.value.max === null
        ? null
        : trimNumber(this.value.max, this.config.decimals),
      this.value.avg === null
        ? null
        : trimNumber(this.value.avg, this.config.decimals),
    ];
  }

  inflate(value: (number | null)[]) {
    return {
      avg: value[6],
      count: value[2],
      first: value[0],
      last: value[1],
      min: value[4],
      max: value[5],
      sum: value[3],
    };
  }

  push(value: number | number[] | AggregateMeasurement['value']) {
    if (Array.isArray(value)) {
      value.map((v) => this.push(v));
      return;
    } else if (typeof value === 'number') {
      this.push({
        avg: null,
        count: 1,
        first: value,
        last: value,
        min: value,
        max: value,
        sum: value,
      });
    } else {
      if (this.value.first === null) {
        this.value.first = value.first;
      }
      if (
        value.max !== null &&
        (this.value.max === null || value.max > this.value.max)
      ) {
        this.value.max = value.max;
      }
      if (
        value.min !== null &&
        (this.value.min === null || value.min < this.value.min)
      ) {
        this.value.min = value.max;
      }
      this.value.sum = this.value.sum + value.sum;
      this.value.count = this.value.count + value.count;
      this.value.avg =
        Math.floor((this.value.sum / this.value.count) * 10000) / 10000;
      this.value.last = value.last;
      this.flush();
    }
  }
}
