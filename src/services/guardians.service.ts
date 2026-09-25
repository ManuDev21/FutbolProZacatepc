import { db } from '@/db/database';
import { createCrudService } from './base';

const crud = createCrudService(db.guardians, 'tutor');

export const guardiansService = {
  ...crud,

  forPlayer(playerId: string) {
    return db.guardians.filter((g) => g.playerIds.includes(playerId)).toArray();
  },
};
