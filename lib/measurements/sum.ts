import { BaseMeasurement } from './base.js';

export class SumMeasurement extends BaseMeasurement {
  value = 0;

  push(value: number | number[]) {
    if (Array.isArray(value)) {
      for (let v of value) {
        this.value = this.value + v;
      }
    } else {
      this.value = this.value + value;
    }
    this.flush();
  }
}