import type { MemoryStoreInit, Store, StoreQueryResult, StoreEntry } from './types.js';

interface MemoryStoreDataEntry {
  entry: StoreEntry;
  expire: number;
}

export class MemoryStore implements Store {
  readonly data: Map<string, MemoryStoreDataEntry[]> = new Map();

  readonly init: MemoryStoreInit;

  #evictExpiredInterval?: NodeJS.Timeout;

  constructor(init: MemoryStoreInit) {
    const {
      evictionInterval = 5 * 60000, 
    } = init;
    this.init = {
      evictionInterval,
    };
    if (this.init.evictionInterval) {
      this.#evictExpiredInterval = setInterval(() => {
        this.#evictExpired();
      }, this.init.evictionInterval);
    }
  }

  #evictExpired() {
    const now = Date.now();
    for (let [ key, map ] of this.data.entries()) {
      for (let [ time, { expire } ] of map.entries()) {
        if (expire && expire < now) {
          this.delete(key, time);
        }
      }
    }
  }

  #ensureKey(key: string): MemoryStoreDataEntry[] {
    let arr = this.data.get(key);
    if (!arr) {
      arr = [];
      this.data.set(key, arr);
    }
    return arr;
  }

  async delete(key: string, time: number) {
    const arr = this.data.get(key) || [];
    const idx = arr.findIndex(({ entry }) => entry[0] === time);
    if (idx >= 0) {
      arr.splice(idx, 1);
    }
  }

  async destroy(): Promise<void> {
    this.clear(); 
    if (this.#evictExpiredInterval) {
      clearInterval(this.#evictExpiredInterval);
      this.#evictExpiredInterval = void 0;
    }
  }

  async get(
    key: string,
    time: number
  ): Promise<StoreEntry | undefined> {
    const arr = this.data.get(key) || [];
    const exists = arr.find(({ entry }) => entry[0] === time);
    if (exists?.expire && exists.expire < Date.now()) {
      this.delete(key, time);
      return void 0;
    }
    return exists?.entry;
  }

  async push(key: string, entry: StoreEntry, expire: number = 0): Promise<void> {
    this.#ensureKey(key).push({
      entry,
      expire,
    }); 
  }

  async set(
    key: string,
    entry: StoreEntry,
    expire: number = 0,
  ): Promise<void> {
    const arr = this.#ensureKey(key);
    const exists = arr.find((item) => item.entry[0] === entry[0]);
    if (exists) {
      exists.entry[1] = entry[1];
      exists.entry[2] = entry[2];
    } else {
      arr.push({
        entry,
        expire,
      });
    }
  }

  async query(
    key: string,
    startTime: number,
    endTime: number,
    limit: number = 1000,
  ): Promise<StoreQueryResult> {
    const now = Date.now();
    const arr = this.data.get(key);
    if (!arr) {
      return {
        entries: [],
        hasMore: false,
      };
    }
    const entries: StoreEntry[] = [];
    const len = arr.length;
    let i = 0;
    for (i = 0; i < len; i ++) {
      const { entry, expire } = arr[i];
      const time = entry[0];
      if (expire && expire < now) {
        this.delete(key, time);

      } else if (time >= startTime && (!endTime || time < endTime)) {
        entries.push(entry);
        if (entries.length === limit) {
          break;
        }
      }
    }
    return {
      entries,
      hasMore: i < len - 1,
    };
  }

  async clear(key?: string): Promise<void> {
    if (key) {
      this.data.delete(key);
    } else {
      this.data.clear();  
    }
  }
}
