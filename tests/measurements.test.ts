import { beforeEach, describe, expect, it } from 'vitest';
import { Measurements } from '../lib/measurements.js';
import { MemoryStore } from '../lib/store.js';

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
      measurements: [{
        interval: 100,
        key: 'test',
        type: 'counter',
      }],
    }, store);
  });

  describe('Intervals', () => {
    it('should create new measurements for each interval', async () => {
      const counter1 = measurements.counter('test');
      counter1.push();
      expect(counter1.value).toEqual(1);
      await delay(110);
      const counter2 = measurements.counter('test');
      expect(counter2).not.toEqual(counter1);
      expect(counter2.value).toEqual(0);
    });
  });

  describe('Counter', () => {
    it('should increment counter', () => {
      const counter = measurements.counter('test');
      expect(counter.value).toEqual(0);
      counter.push();
      counter.push();
      counter.push();
      expect(counter.value).toEqual(3);
    });

    it('should increment counter by specified value', () => {
      const counter = measurements.counter('test');
      expect(counter.value).toEqual(0);
      counter.push(4);
      expect(counter.value).toEqual(4);
    });
  });
});