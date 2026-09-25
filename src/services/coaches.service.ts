import { db } from '@/db/database';
import type { Coach } from '@/types';
import { createCrudService } from './base';

const crud = createCrudService(db.coaches, 'entrenador');

export const coachesService = {
  ...crud,

  active(): Promise<Coach[]> {
    return db.coaches.filter((c) => c.active).toArray();
  },
};
