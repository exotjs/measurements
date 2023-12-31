export abstract class Storage {
  abstract get<T>(
    key: string,
    time: number
  ): Promise<T | undefined>;

  abstract put<T>(
    key: string,
    time: number,
    value: T
  ): Promise<void>;

  abstract range<T>(
    key: string,
    startTime: number,
    endTime: number
  ): Promise<[number, T][]>;
}

export class MemoryStorage extends Storage {
  readonly measurements: Map<string, Map<number, any>> = new Map();

  async get<T>(
    key: string,
    time: number
  ): Promise<T | undefined> {
    return this.measurements.get(key)?.get(time) as T;
  }

  async put<T>(
    key: string,
    time: number,
    value: T
  ): Promise<void> {
    let map = this.measurements.get(key);
    if (!map) {
      map = new Map();
      this.measurements.set(key, map);
    }
    map.set(time, value);
  }

  async range<T>(
    key: string,
    startTime: number,
    endTime: number
  ): Promise<[number, T][]> {
    const map = this.measurements.get(key);
    if (!map) {
      return [];
    }
    const result: [number, T][] = [];
    for (let [ time, value ] of map.entries()) {
      if (time >= startTime && time < endTime) {
        result.push([time, value as T]);
      }
    }
    return result;
  }
}
