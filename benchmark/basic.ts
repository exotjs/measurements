import { benchmark } from './helpers.js';
import { Measurements } from '../lib/measurements.js';
import { MemoryStore } from '../lib/store.js';

const interval = 5000;

const measurements = new Measurements({
  measurements: [{
    interval,
    key: 'm1',
    type: 'aggregate',
  }, {
    flushDelay: 500,
    interval,
    key: 'm2',
    type: 'aggregate',
  }],
  store: new MemoryStore(),
});

await benchmark('Aggregate: push to measurement instance', (bench) => {
  measurements.reset();
  const m1 = measurements.aggregate('m1');
  const m2 = measurements.aggregate('m2');

  bench
    .add('push', () => {
      m1.push([Math.random() * 10]);
    })
    .add('push (with flushDelay)', () => {
      m2.push([Math.random() * 10]);
    })
});

await benchmark('Aggregate: get measurement with constant time and push', (bench) => {
  measurements.reset();

  bench
    .add('push', () => {
      const m1 = measurements.aggregate('m1', 0);
      m1.push([Math.random() * 10]);
    })
    .add('push (with flushDelay)', () => {
      const m2 = measurements.aggregate('m2', 0);
      m2.push([Math.random() * 10]);
    })
});

await benchmark('Aggregate: get measurement with distinct incremental time and push', (bench) => {
  let time = 0;

  measurements.reset();

  bench
    .add('push', () => {
      const m1 = measurements.aggregate('m1', time);
      m1.push([Math.random() * 10]);
      time += interval;
    })
});

measurements.destroy();