import { db } from '@/db/database';
import { createCrudService } from './base';

const crud = createCrudService(db.events, 'evento');

export const eventsService = {
  ...crud,

  inRange(from: string, to: string) {
    return db.events.where('date').between(from, to, true, true).sortBy('date');
  },
};
