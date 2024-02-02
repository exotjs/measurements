import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Measurements } from '../lib/measurements.js';
import { MemoryStore } from '../lib/store.js';
import { roundTime } from '../lib/helpers.js';
import type { MeasurementConfig } from '../lib/types.js';

const interval = 100;

const measurementsConfig: MeasurementConfig[] = [{
  interval,
  key: 'test:value',
  type: 'value',
}, {
  interval,
  key: 'test:sum',
  type: 'sum',
}, {
  interval,
  key: 'test:aggregate',
  type: 'aggregate',
}];

async function delay(delay: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

describe('Measurements', () => {
  const store = new MemoryStore({
    evictionInterval: 1000,
  });

  let measurements: Measurements;

  beforeEach(() => {
    measurements = new Measurements({
      measurements: measurementsConfig,
      store,
    });
  });

  afterEach(() => {
    measurements?.reset();
  });

  describe('Intervals', () => {
    it('should create new measurements for each interval', async () => {
      const counter1 = measurements.sum('test:sum');
      counter1.push(1);
      expect(counter1.value).toEqual(1);
      await delay(110);
      const counter2 = measurements.sum('test:sum');
      expect(counter2).not.toEqual(counter1);
      expect(counter2.value).toEqual(0);
    });
  });

  describe('Value', () => {
    it('should store value', () => {
      const value = measurements.value('test:value');
      value.push(1);
      value.push(3);
      expect(value.value).toEqual(3);
    });
  });

  describe('Sum', () => {
    it('should increment counter', () => {
      const counter = measurements.sum('test:sum');
      expect(counter.value).toEqual(0);
      counter.push(1);
      counter.push(1);
      counter.push(1);
      expect(counter.value).toEqual(3);
    });

    it('should increment counter by specified value', () => {
      const counter = measurements.sum('test:sum');
      expect(counter.value).toEqual(0);
      counter.push(4);
      expect(counter.value).toEqual(4);
    });
  });

  describe('Aggregate', () => {
    it('should calculate min/max/avg', () => {
      const number = measurements.aggregate('test:aggregate');
      expect(number.value).toEqual({
        avg: null,
        count: 0,
        first: null,
        last: null,
        min: null,
        max: null,
        sum: 0,
      });
      number.push(1);
      expect(number.value).toEqual({
        avg: 1,
        count: 1,
        first: 1,
        last: 1,
        min: 1,
        max: 1,
        sum: 1,
      });
      number.push(3);
      expect(number.value).toEqual({
        avg: 2,
        count: 2,
        first: 1,
        last: 3,
        min: 1,
        max: 3,
        sum: 4,
      });
    });
  });

  describe('Export', () => {
    it('should return deflated data', async () => {
      const time = interval;
      const number = measurements.aggregate('test:aggregate', time);
      const counter = measurements.sum('test:sum', time);
      number.push(1);
      counter.push(1);
      const data = await measurements.export();
      expect(data.find(({ config }) => config.key === 'test:sum')?.measurements).toEqual([
        [time, '', 1],
      ]);
      expect(data.find(({ config }) => config.key === 'test:aggregate')?.measurements).toEqual([
        [time, '', [1, 1, 1, 1, 1, 1, 1]],
      ]);
    });

    it('should fill non-existent times', async () => {
      const time = interval;
      const counter = measurements.sum('test:sum', time);
      counter.push(1);
      const data = await measurements.export({
        fill: true,
        endTime: time + interval,
        startTime: time - (interval * 2),
      });
      expect(data.find(({ config }) => config.key === 'test:sum')?.measurements).toEqual([
        [time - (interval * 2), '', 0],
        [time - interval, '', 0],
        [time, '', 1],
      ]);
    });

    it('should downsample entries', async () => {
      const time = interval * 6;
      for (let t = time - (6 * interval); t <= time; t += interval) {
        measurements.sum('test:sum', t).push(1);
      }
      const data = await measurements.export({
        downsample: interval * 3,
        endTime: time + interval,
        startTime: time - (interval * 6),
      });
      expect(data.find(({ config }) => config.key === 'test:sum')?.measurements).toEqual([
        [0, '', 3],
        [interval * 3, '', 3],
        [interval * 6, '', 1],
      ]);
    });

    it('should match test:* using wildcard', async () => {
      const data = await measurements.export({
        keys: ['test:*'],
      });
      expect(data.length).toEqual(3);
    });

    it('should match test:aggregate using wildcard', async () => {
      const data = await measurements.export({
        keys: ['*:aggregate'],
      });
      expect(data.length).toEqual(1);
      expect(data[0].config.key).toEqual('test:aggregate');
    });
  });

  describe('Import', () => {
    it('should import deflated data', async () => {
      const time = roundTime(Date.now(), interval);
      const number = measurements.aggregate('test:aggregate', time);
      number.push(1);
      const data = await measurements.export();
      const measurementsCopy = new Measurements({
        measurements: measurementsConfig,
        store: new MemoryStore({}),
      });
      measurementsCopy.import(data);
      const dataCopy = await measurements.export();
      expect(dataCopy).toEqual(data);
    });
  });

  describe('Distinct labels', () => {
    it('should store distinct measurements with distinct labels', async () => {
      const time = roundTime(Date.now(), interval);
      const counter1 = measurements.sum('test:sum', time, 'label1');
      const counter2 = measurements.sum('test:sum', time, 'label2');
      counter1.push(2);
      counter2.push(3);
      expect(counter1.value).toEqual(2);
      expect(counter2.value).toEqual(3);
      const data = await measurements.export();
      expect(data.find(({ config }) => config.key === 'test:sum')?.measurements).toEqual([
        [time, 'label1', 2],
        [time, 'label2', 3],
      ]);
    });
  });
});