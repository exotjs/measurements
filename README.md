# Exot Measurements

Exot Measurements is an in-memory time series database with optional persistent storage. It serves as a core component of the [Exot Inspector](https://exot.dev) for storing metrics. This module is compatible with any JavaScript runtime, including Node.js, Bun, Deno, and web browsers.

## Features

- Fast, in-memory time-series aggregations
- Low memory footprint
- Optional persistance

## Usage

```ts
import { Measurements } from '@exotjs/measurements';
import { MemoryStore } from '@exotjs/measurements/store';

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

```


## API

### `new Measurements(options)`

Instantiate a new Measurements instance.

```ts
new Measurements({
  measurements: [{
    interval: 5000,
    key: 'temperature',
    type: 'aggregate',
  }],
  store: new MemoryStore(),
})
```

Available options:

- `measurements: MeasurementConfig[]`
- `store: Store` (required)

### `aggregate(key, time?, label?)`

Return an instance of the AggregateMeasurement for the given key, time, and label.

### `async export(options)`

Returns an exported measurements with configurations and measurements.

Available options:

- `downsample: number`
- `endTime: number`
- `fill: boolean`
- `keys: string[]`
- `startTime: number`

### `async import(data)`

Import data returned from the `.export()` method.

### `push(data)`

Push new values to multiple measurements.

```ts
measurements.push({
  temperature: [{
    label: 'hdd1',
    values: [43.2, 48.9],
  }],
});
```

### `reset()`

Clear in-memory measurements and the underlying store.


### `sum(key, time?, label?)`

Return an instance of the SumMeasurement for the given key, time, and label.

### `value(key, time?, label?)`

Return an instance of the ValueMeasurement for the given key, time, and label.

## Measurements

Available measurement types:

- `aggregate`
- `sum`
- `value`

### AggregateMeasurement

Stores an aggregate object.

```ts
interface AggregateMeasurement {
  value: {
    avg: null | number;
    count: number;
    first: null | number;
    last: null | number;
    min: null | number;
    max: null | number;
    sum: number;
  };
}
```

### SumMeasurement

Stores a single numeric value representing the sum of the values.

```ts
interface SumMeasurement {
  value: number;
}
```

### ValueMeasurement

Stores the last pushed value.

```ts
interface ValueMeasurement {
  value: number;
}
```

## License

MIT