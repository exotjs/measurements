import type {
  MemoryStoreInit,
  MemoryStoreDataEntry,
  Store,
  StoreQueryResult,
  StoreEntry,
} from './types.ts';

export class MemoryStore implements Store {
  readonly lists: Map<string, MemoryStoreDataEntry[]> = new Map();

  readonly sets: Map<string, Map<string, MemoryStoreDataEntry>> = new Map();

  readonly init: MemoryStoreInit;

  #evictExpiredInterval?: unknown;

  constructor(init: MemoryStoreInit = {}) {
    const { evictionInterval = 5 * 60000, maxEntries } = init;
    this.init = {
      evictionInterval,
      maxEntries,
    };
    if (this.init.evictionInterval) {
      this.#evictExpiredInterval = setInterval(() => {
        this.#evictExpired();
      }, this.init.evictionInterval);
      if (
        typeof this.#evictExpiredInterval !== 'number' &&
        // @ts-ignore
        'unref' in this.#evictExpiredInterval
      ) {
        // @ts-ignore
        this.#evictExpiredInterval.unref();
      }
    }
  }

  #evictExpired() {
    const now = Date.now();
    for (let [_, list] of this.lists) {
      for (let entry of list) {
        if (entry.expire && entry.expire < now) {
          list.splice(list.indexOf(entry), 1);
        }
      }
    }
    for (let [key, map] of this.sets) {
      for (let [_, { expire, time, label }] of map) {
        if (expire && expire < now) {
          this.setDelete(key, time, label);
        }
      }
    }
  }

  #adjustSize(key: string) {
    const maxEntries = this.init.maxEntries;
    const map = this.sets.get(key);
    if (map && maxEntries && map.size > maxEntries) {
      for (let [k] of map) {
        map.delete(k);
        if (map.size <= maxEntries) {
          break;
        }
      }
    }
  }

  #ensureList(key: string): MemoryStoreDataEntry[] {
    let list = this.lists.get(key);
    if (!list) {
      list = [];
      this.lists.set(key, list);
    }
    return list;
  }

  #ensureSet(key: string): Map<string, MemoryStoreDataEntry> {
    let set = this.sets.get(key);
    if (!set) {
      set = new Map();
      this.sets.set(key, set);
    }
    return set;
  }

  #getEntryUid(time: number, label: string = '') {
    return time + ':' + label;
  }

  async destroy(): Promise<void> {
    this.clear();
    if (this.#evictExpiredInterval) {
      clearInterval(this.#evictExpiredInterval as number);
      this.#evictExpiredInterval = void 0;
    }
  }
  async listAdd<T>(
    key: string,
    time: number,
    label: string,
    value: T,
    expire: number = 0
  ): Promise<void> {
    const list = this.#ensureList(key);
    list.push({
      expire,
      label,
      time,
      value,
    });
    if (this.init.maxEntries && list.length > this.init.maxEntries) {
      list.splice(0, list.length - this.init.maxEntries);
    }
  }

  async listDelete(key: string, time: number, label: string) {
    const list = this.lists.get(key);
    if (list) {
      const toDelete = list.filter(
        (entry) => entry.time === time && entry.label === label
      );
      for (let entry of toDelete) {
        list.splice(list.indexOf(entry), 1);
      }
    }
  }

  async listQuery(
    key: string,
    startTime: number,
    endTime: number = -1,
    limit: number = 1000
  ): Promise<StoreQueryResult> {
    const now = Date.now();
    const list = this.lists.get(key);
    if (!list) {
      return {
        entries: [],
        hasMore: false,
      };
    }
    const entries: StoreEntry[] = [];
    for (let { expire, label, time, value } of list) {
      if (expire && expire < now) {
        this.setDelete(key, time, label);
      } else if (time >= startTime && (endTime === -1 || time < endTime)) {
        entries.push([time, label, value]);
        if (entries.length > limit) {
          break;
        }
      }
    }
    return {
      entries: entries.slice(0, limit),
      hasMore: entries.length > limit,
    };
  }

  async setAdd<T>(
    key: string,
    time: number,
    label: string,
    value: T,
    expire: number = 0,
  ): Promise<void> {
    const uid = this.#getEntryUid(time, label);
    const map = this.#ensureSet(key);
    const exists = map.get(uid);
    if (exists) {
      exists.value = value;
    } else {
      map.set(uid, {
        expire,
        label,
        time,
        value,
      });
      this.#adjustSize(key);
    }
  }

  async setDelete(key: string, time: number, label: string) {
    const map = this.sets.get(key);
    if (map) {
      map.delete(this.#getEntryUid(time, label));
    }
  }

  async setQuery(
    key: string,
    startTime: number,
    endTime: number,
    limit: number = 1000
  ): Promise<StoreQueryResult> {
    const now = Date.now();
    const map = this.sets.get(key);
    if (!map) {
      return {
        entries: [],
        hasMore: false,
      };
    }
    const entries: StoreEntry[] = [];
    for (let [_, { expire, label, time, value }] of map) {
      if (expire && expire < now) {
        this.setDelete(key, time, label);
      } else if (time >= startTime && (endTime === -1 || time < endTime)) {
        entries.push([time, label, value]);
        if (entries.length > limit) {
          break;
        }
      }
    }
    return {
      entries: entries.slice(0, limit),
      hasMore: entries.length > limit,
    };
  }

  async clear(key?: string): Promise<void> {
    if (key) {
      this.lists.delete(key);
      this.sets.delete(key);
    } else {
      this.lists.clear();
      this.sets.clear();
    }
  }
}
