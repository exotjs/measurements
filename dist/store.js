export class MemoryStore {
    data = new Map();
    init;
    #evictExpiredInterval;
    constructor(init) {
        const { evictionInterval = 5 * 60000, } = init;
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
        for (let [key, map] of this.data.entries()) {
            for (let [time, { expire }] of map.entries()) {
                if (expire && expire < now) {
                    this.delete(key, time);
                }
            }
        }
    }
    #ensureKey(key) {
        let arr = this.data.get(key);
        if (!arr) {
            arr = [];
            this.data.set(key, arr);
        }
        return arr;
    }
    async delete(key, time) {
        const arr = this.data.get(key) || [];
        const idx = arr.findIndex(({ entry }) => entry[0] === time);
        if (idx >= 0) {
            arr.splice(idx, 1);
        }
    }
    async destroy() {
        this.clear();
        if (this.#evictExpiredInterval) {
            clearInterval(this.#evictExpiredInterval);
            this.#evictExpiredInterval = void 0;
        }
    }
    async get(key, time) {
        const arr = this.data.get(key) || [];
        const exists = arr.find(({ entry }) => entry[0] === time);
        if (exists?.expire && exists.expire < Date.now()) {
            this.delete(key, time);
            return void 0;
        }
        return exists?.entry;
    }
    async push(key, entry, expire = 0) {
        this.#ensureKey(key).push({
            entry,
            expire,
        });
    }
    async set(key, entry, expire = 0) {
        const arr = this.#ensureKey(key);
        const exists = arr.find((item) => item.entry[0] === entry[0]);
        if (exists) {
            exists.entry[1] = entry[1];
            exists.entry[2] = entry[2];
        }
        else {
            arr.push({
                entry,
                expire,
            });
        }
    }
    async query(key, startTime, endTime, limit = 1000) {
        const now = Date.now();
        const arr = this.data.get(key);
        if (!arr) {
            return {
                entries: [],
                hasMore: false,
            };
        }
        const entries = [];
        const len = arr.length;
        let i = 0;
        for (i = 0; i < len; i++) {
            const { entry, expire } = arr[i];
            const time = entry[0];
            if (expire && expire < now) {
                this.delete(key, time);
            }
            else if (time >= startTime && (!endTime || time < endTime)) {
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
    async clear(key) {
        if (key) {
            this.data.delete(key);
        }
        else {
            this.data.clear();
        }
    }
}
