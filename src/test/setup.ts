import 'fake-indexeddb/auto';
import { beforeEach } from 'vitest';
import { db } from '@/db/database';

// Stub mínimo de localStorage para el entorno node de vitest.
const mem = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
} as Storage;

beforeEach(async () => {
  mem.clear();
  await Promise.all(db.tables.map((t) => t.clear()));
});
