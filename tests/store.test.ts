import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryStore } from '../lib/store.js';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore({
      evictionInterval: 500,
    });
  });

  afterEach(() => {
    if (store) {
      store.destroy();
    }
  });

  describe('.listAdd()', () => {
    it('should add value to the list', () => {
      expect(store.lists.size).toEqual(0);
      store.listAdd('test', 0, '', '123');
      store.listAdd('test', 0, '', '123');
      expect(store.lists.size).toEqual(1);
      expect(store.lists.get('test')?.length).toEqual(2);
    });
  });

  describe('.listQuery()', () => {
    it('should return all entries', async () => {
      store.listAdd('test', 1, '', '1');
      store.listAdd('test', 2, '', '2');
      store.listAdd('test', 3, '', '3');
      const result = await store.listQuery('test', 0, -1);
      expect(result.entries).toEqual([
        [1, '', '1'],
        [2, '', '2'],
        [3, '', '3'],
      ]);
      expect(result.hasMore).toEqual(false);
    });

    it('should return one entry', async () => {
      store.listAdd('test', 1, '', '1');
      store.listAdd('test', 2, '', '2');
      store.listAdd('test', 3, '', '3');
      store.listAdd('test', 4, '', '4');
      const result = await store.listQuery('test', 2, 4);
      expect(result.entries).toEqual([
        [2, '', '2'],
        [3, '', '3'],
      ]);
      expect(result.hasMore).toEqual(true);
    });
  });

  describe('.setAdd()', () => {
    it('should replace existing value', () => {
      expect(store.sets.size).toEqual(0);
      store.setAdd('test', 0, '', '1');
      store.setAdd('test', 0, '', '2');
      store.setAdd('test', 0, '', '3');
      expect(store.sets.size).toEqual(1);
      expect(store.sets.get('test')?.size).toEqual(1);
      expect(Object.fromEntries(store.sets.get('test')!)).toEqual({
        '0:': {
          expire: 0,
          label: '',
          time: 0,
          value: '3',
        },
      });
    });

    it('should set values with distinct time', () => {
      expect(store.sets.size).toEqual(0);
      store.setAdd('test', 0, '', '123');
      store.setAdd('test', 1, '', '123');
      store.setAdd('test', 2, '', '123');
      expect(store.sets.size).toEqual(1);
      expect(store.sets.get('test')?.size).toEqual(3);
    });

    it('should set values with distinct label', () => {
      expect(store.sets.size).toEqual(0);
      store.setAdd('test', 0, 'label1', '123');
      store.setAdd('test', 0, 'label2', '123');
      store.setAdd('test', 0, 'label3', '123');
      expect(store.sets.size).toEqual(1);
      expect(store.sets.get('test')?.size).toEqual(3);
    });

    it('should set entry ttl', async () => {
      store.setAdd('test', 0, '', '123', 100);
      expect(store.sets.size).toEqual(1);
      expect(store.sets.get('test')?.size).toEqual(1);
      await new Promise((resolve) => setTimeout(resolve, 600));
      expect(store.sets.get('test')?.size).toEqual(0);
    });
  });

  describe('.setDelete()', () => {
    it('should delete an entry', () => {
      store.setAdd('test', 1, '', '1');
      store.setDelete('test', 1, '');
      expect(store.sets.size).toEqual(1);
      expect(store.sets.get('test')?.size).toEqual(0);
    });
  });

  describe('.setQuery()', () => {
    it('should return all entries', async () => {
      store.setAdd('test', 1, '', '1');
      store.setAdd('test', 2, '', '2');
      store.setAdd('test', 3, '', '3');
      const result = await store.setQuery('test', 0, -1);
      expect(result.entries).toEqual([
        [1, '', '1'],
        [2, '', '2'],
        [3, '', '3'],
      ]);
      expect(result.hasMore).toEqual(false);
    });

    it('should return one entry', async () => {
      store.setAdd('test', 1, '', '1');
      store.setAdd('test', 2, '', '2');
      store.setAdd('test', 3, '', '3');
      store.setAdd('test', 4, '', '4');
      const result = await store.setQuery('test', 2, 4);
      expect(result.entries).toEqual([
        [2, '', '2'],
        [3, '', '3'],
      ]);
      expect(result.hasMore).toEqual(true);
    });
  });

  describe('.clear()', () => {
    it('shoudl remove all data', () => {
      store.setAdd('test1', 1, '', '1');
      store.setAdd('test2', 2, '', '2');
      store.clear();
      expect(store.sets.size).toEqual(0);
    });
  });
});
