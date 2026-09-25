import { db } from '@/db/database';
import { createCrudService } from './base';

const crud = createCrudService(db.teams, 'equipo');

export const teamsService = { ...crud };
