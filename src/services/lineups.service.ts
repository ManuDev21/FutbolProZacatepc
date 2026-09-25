import { db } from '@/db/database';
import type { Lineup } from '@/types';
import { createCrudService } from './base';

const crud = createCrudService(db.lineups, 'alineación');

export const lineupsService = {
  ...crud,

  forCategory(categoryId: string): Promise<Lineup[]> {
    return db.lineups.where('categoryId').equals(categoryId).toArray();
  },
};
