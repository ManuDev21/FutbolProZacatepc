import { db } from '@/db/database';
import type { Evaluation } from '@/types';
import { createCrudService } from './base';

const crud = createCrudService(db.evaluations, 'evaluación');

export const evaluationsService = {
  ...crud,

  forPlayer(playerId: string): Promise<Evaluation[]> {
    return db.evaluations.where('playerId').equals(playerId).sortBy('date');
  },

  /** Últimas dos evaluaciones (actual y anterior) para comparativas. */
  async latestPair(playerId: string): Promise<{ current?: Evaluation; previous?: Evaluation }> {
    const list = await this.forPlayer(playerId);
    return { current: list.at(-1), previous: list.at(-2) };
  },
};
