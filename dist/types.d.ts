export interface MeasurementConfig {
    interval: number;
    key: string;
    type: 'counter' | 'number' | 'value';
}
export interface Init {
    measurements: MeasurementConfig[];
}
export interface ExportOptions {
    downsample?: number;
    endTime?: number;
    keys?: string[];
    startTime?: number;
}
export interface MeasurementExported<T = any> {
    config: MeasurementConfig;
    measurements: [number, T][];
}
