import { db } from '@/db/database';
import { nowISO, uuid } from '@/lib/utils';
import exercisesJson from '@/data/exercises.json';
import type { Exercise } from '@/types';
import { createCrudService } from './base';
import { auditService } from './audit.service';

const crud = createCrudService(db.exercises, 'ejercicio');

interface RawExercise {
  code: string;
  name: string;
  variant?: string;
  description?: string;
  area?: string;
  minAge?: number;
  maxAge?: number;
  difficulty?: number;
  objective?: string;
  durationMin?: number;
  playersMin?: number;
  playersMax?: number;
  materials?: string[];
  tags?: string[];
}

export const exercisesService = {
  ...crud,

  /** Importa exercises.json → IndexedDB una sola vez (sin duplicar). */
  async importLibrary(): Promise<number> {
    const existing = await db.exercises.count();
    if (existing > 0) return 0;
    const raw = exercisesJson as RawExercise[];
    const entities: Exercise[] = raw.map((e) => ({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      code: e.code,
      name: e.variant ? `${e.name} — ${e.variant}` : e.name,
      description: e.description,
      area: e.area,
      minAge: e.minAge,
      maxAge: e.maxAge,
      difficulty: (e.difficulty ?? 3) as Exercise['difficulty'],
      objective: e.objective,
      durationMin: e.durationMin,
      playersMin: e.playersMin,
      playersMax: e.playersMax,
      materials: e.materials ?? [],
      tags: e.tags ?? [],
      favorite: false,
      builtin: true,
    }));
    await db.exercises.bulkAdd(entities);
    await auditService.log('importar', 'ejercicios', undefined, `${entities.length} ejercicios`);
    return entities.length;
  },

  async toggleFavorite(id: string): Promise<void> {
    const ex = await db.exercises.get(id);
    if (!ex) return;
    await db.exercises.update(id, { favorite: !ex.favorite, updatedAt: nowISO() });
  },
};
