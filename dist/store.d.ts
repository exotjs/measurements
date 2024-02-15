import type { MemoryStoreInit, MemoryStoreDataEntry, Store, StoreQueryResult } from './types.js';
export declare class MemoryStore implements Store {
    #private;
    readonly lists: Map<string, MemoryStoreDataEntry[]>;
    readonly sets: Map<string, Map<string, MemoryStoreDataEntry>>;
    readonly init: MemoryStoreInit;
    constructor(init?: MemoryStoreInit);
    destroy(): Promise<void>;
    listAdd<T>(key: string, time: number, label: string, value: T, expire?: number): Promise<void>;
    listDelete(key: string, time: number, label: string): Promise<void>;
    listQuery(key: string, startTime: number, endTime?: number, limit?: number): Promise<StoreQueryResult>;
    setAdd<T>(key: string, time: number, label: string, value: T, expire?: number, replace?: boolean): Promise<void>;
    setDelete(key: string, time: number, label: string): Promise<void>;
    setQuery(key: string, startTime: number, endTime: number, limit?: number): Promise<StoreQueryResult>;
    clear(key?: string): Promise<void>;
}
