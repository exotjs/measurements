export interface MeasurementConfig {
    decimals?: number;
    flushDelay?: number;
    interval: number;
    label?: string;
    key: string;
    type: 'aggregate' | 'sum' | 'value';
    sensor?: string;
}
export interface Init {
    measurements: MeasurementConfig[];
    onError?: (err: any) => void;
    store?: Store;
}
export interface ExportOptions {
    downsample?: number;
    fill?: boolean;
    endTime?: number;
    keys?: string[];
    startTime?: number;
}
export interface MeasurementExported<T = any> {
    config: MeasurementConfig;
    measurements: [number, string, T][];
}
export interface Store {
    clear(key?: string): Promise<void>;
    destroy(): Promise<void>;
    listDelete(key: string, time: number, label: string): Promise<void>;
    listAdd<T>(key: string, time: number, label: string, value: T, expire?: number): Promise<void>;
    listQuery(key: string, startTime: number, endTime: number, limit?: number): Promise<StoreQueryResult>;
    setAdd<T>(key: string, time: number, label: string, value: T, expire?: number): Promise<void>;
    setDelete(key: string, time: number, label: string): Promise<void>;
    setQuery(key: string, startTime: number, endTime: number, limit?: number): Promise<StoreQueryResult>;
}
export type StoreEntry<Value = string> = [number, string, Value];
export interface StoreQueryResult {
    entries: StoreEntry[];
    hasMore: boolean;
}
export interface MemoryStoreInit {
    evictionInterval?: number;
    maxEntries?: number;
}
export interface MemoryStoreDataEntry {
    expire: number;
    label: string;
    time: number;
    value: any;
}
