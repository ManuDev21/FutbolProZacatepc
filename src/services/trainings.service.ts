import { db } from '@/db/database';
import type { Training } from '@/types';
import { createCrudService } from './base';
import { auditService } from './audit.service';

const crud = createCrudService(db.trainings, 'entrenamiento');

export function trainingDuration(t: Training): number {
  return t.steps.reduce((acc, s) => acc + (s.durationMin || 0), 0);
}

export const trainingsService = {
  ...crud,

  async duplicate(id: string): Promise<Training | undefined> {
    const t = await db.trainings.get(id);
    if (!t) return undefined;
    const copy = await crud.create({
      name: `${t.name} (copia)`,
      categoryId: t.categoryId,
      coachId: t.coachId,
      date: t.date,
      objective: t.objective,
      level: t.level,
      steps: t.steps.map((s) => ({ ...s })),
      notes: t.notes,
    });
    await auditService.log('duplicar', 'entrenamiento', id);
    return copy;
  },

  upcoming(limit = 5): Promise<Training[]> {
    const today = new Date().toISOString().slice(0, 10);
    return db.trainings
      .where('date')
      .aboveOrEqual(today)
      .sortBy('date')
      .then((r) => r.slice(0, limit));
  },
};
