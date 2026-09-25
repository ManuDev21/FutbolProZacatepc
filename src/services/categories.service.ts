import { db } from '@/db/database';
import type { Category } from '@/types';
import { createCrudService } from './base';

const crud = createCrudService(db.categories, 'categoría');

export const categoriesService = {
  ...crud,

  active(): Promise<Category[]> {
    return db.categories.filter((c) => c.active).toArray();
  },

  /** Cantidad de jugadores por categoría. */
  async playerCounts(): Promise<Record<string, number>> {
    const players = await db.players.where('status').anyOf('activo', 'lesionado').toArray();
    const counts: Record<string, number> = {};
    for (const p of players) {
      if (p.categoryId) counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
    }
    return counts;
  },
};
