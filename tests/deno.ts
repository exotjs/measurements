import { assertEquals } from 'https://deno.land/std@0.213.0/assert/mod.ts';
import { Measurements } from '../deno_dist/index.ts';
import { MemoryStore } from '../deno_dist/store.ts';

function delay(delay: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

Deno.test('Measurements', async (t) => {
  const interval = 100;

  const store = new MemoryStore();

  const measurements = new Measurements({
    measurements: [{
      interval,
      key: 'test:sum',
      type: 'sum',
    }],
    store,
  });

  await t.step('should create new measurements for each interval', async () => {
    const counter1 = measurements.sum('test:sum');
    counter1.push(1);
    assertEquals(counter1.value, 1);
    await delay(interval + 10);
    const counter2 = measurements.sum('test:sum');
    assertEquals(counter2 !== counter1, true);
    assertEquals(counter2.value, 0);
  });

  store.destroy();
  measurements.destroy();
});
