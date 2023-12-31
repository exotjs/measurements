export declare abstract class Storage {
    abstract get<T>(key: string, time: number): Promise<T | undefined>;
    abstract put<T>(key: string, time: number, value: T): Promise<void>;
    abstract range<T>(key: string, startTime: number, endTime: number): Promise<[number, T][]>;
}
export declare class MemoryStorage extends Storage {
    readonly measurements: Map<string, Map<number, any>>;
    get<T>(key: string, time: number): Promise<T | undefined>;
    put<T>(key: string, time: number, value: T): Promise<void>;
    range<T>(key: string, startTime: number, endTime: number): Promise<[number, T][]>;
}
