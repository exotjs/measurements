export class Storage {
}
export class MemoryStorage extends Storage {
    measurements = new Map();
    async get(key, time) {
        return this.measurements.get(key)?.get(time);
    }
    async put(key, time, value) {
        let map = this.measurements.get(key);
        if (!map) {
            map = new Map();
            this.measurements.set(key, map);
        }
        map.set(time, value);
    }
    async range(key, startTime, endTime) {
        const map = this.measurements.get(key);
        if (!map) {
            return [];
        }
        const result = [];
        for (let [time, value] of map.entries()) {
            if (time >= startTime && time < endTime) {
                result.push([time, value]);
            }
        }
        return result;
    }
}
