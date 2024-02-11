import { BaseMeasurement } from './base.js';
export class SumMeasurement extends BaseMeasurement {
    value = 0;
    push(value) {
        if (Array.isArray(value)) {
            for (const v of value) {
                this.value = this.value + v;
            }
        }
        else {
            this.value = this.value + value;
        }
        this.flush();
    }
}
