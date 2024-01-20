import type { MemoryStoreInit, Store, StoreQueryResult, StoreEntry } from './types.js';
interface MemoryStoreDataEntry {
    entry: StoreEntry;
    expire: number;
}
export declare class MemoryStore implements Store {
    #private;
    readonly data: Map<string, MemoryStoreDataEntry[]>;
    readonly init: MemoryStoreInit;
    constructor(init: MemoryStoreInit);
    delete(key: string, time: number): Promise<void>;
    destroy(): Promise<void>;
    get(key: string, time: number): Promise<StoreEntry | undefined>;
    push(key: string, entry: StoreEntry, expire?: number): Promise<void>;
    set(key: string, entry: StoreEntry, expire?: number): Promise<void>;
    query(key: string, startTime: number, endTime: number, limit?: number): Promise<StoreQueryResult>;
    clear(key?: string): Promise<void>;
}
export {};
