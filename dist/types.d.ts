export interface MeasurementConfig {
    interval: number;
    key: string;
    type: 'counter' | 'number' | 'value';
    sensor?: string;
}
export interface Init {
    measurements: MeasurementConfig[];
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
    delete(key: string, time: number): Promise<void>;
    destroy(): Promise<void>;
    get(key: string, time: number): Promise<StoreEntry | undefined>;
    push(key: string, entry: StoreEntry, expire?: number): Promise<void>;
    set(key: string, entry: StoreEntry, expire?: number): Promise<void>;
    query<T>(key: string, startTime: number, endTime: number, limit?: number): Promise<StoreQueryResult>;
}
export type StoreEntry<Value = string> = [number, string, Value];
export interface StoreQueryResult {
    entries: StoreEntry[];
    hasMore: boolean;
}
export interface MemoryStoreInit {
    evictionInterval?: number;
}
