import { Measurements } from '../lib/measurements.js';
import { MemoryStore } from '../lib/store.js';

const measurements = new Measurements({
  measurements: [{
    interval: 5000,
    key: 'temperature',
    type: 'aggregate',
  }],
  store: new MemoryStore(),
});

const aggregate = measurements.aggregate('temperature');

aggregate.push([51.7, 53.6, 49.2]);

const { avg, count, first, last, max, min, sum } = aggregate.value;
