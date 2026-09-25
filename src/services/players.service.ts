import { db } from '@/db/database';
import { todayISO } from '@/lib/utils';
import type { Player, PlayerStats } from '@/types';
import { createCrudService } from './base';

const crud = createCrudService(db.players, 'jugador');

export const playersService = {
  ...crud,

  byCategory(categoryId: string): Promise<Player[]> {
    return db.players.where('categoryId').equals(categoryId).toArray();
  },

  activeByCategory(categoryId: string): Promise<Player[]> {
    return db.players
      .where('categoryId')
      .equals(categoryId)
      .filter((p) => p.status === 'activo' || p.status === 'lesionado')
      .toArray();
  },

  /** Estadísticas consolidadas del jugador: asistencia, pagos y última evaluación. */
  async stats(playerId: string): Promise<PlayerStats> {
    const today = todayISO();
    const attendances = await db.attendances.toArray();
    let presentes = 0,
      ausentes = 0,
      retardos = 0,
      justificados = 0,
      total = 0;
    for (const a of attendances) {
      const rec = a.records.find((r) => r.playerId === playerId);
      if (!rec) continue;
      total++;
      if (rec.status === 'presente') presentes++;
      else if (rec.status === 'ausente') ausentes++;
      else if (rec.status === 'retardo') retardos++;
      else if (rec.status === 'justificado') justificados++;
    }
    const payments = await db.payments.where('playerId').equals(playerId).toArray();
    let pagados = 0,
      pendientes = 0,
      vencidos = 0,
      parciales = 0;
    for (const p of payments) {
      const vencido = p.status !== 'pagado' && p.dueDate < today;
      if (p.status === 'pagado') pagados++;
      else if (p.status === 'parcial') parciales++;
      else if (vencido || p.status === 'vencido') vencidos++;
      else pendientes++;
    }
    const latestEvaluation = (await db.evaluations.where('playerId').equals(playerId).sortBy('date')).at(-1);
    const asistibles = presentes + ausentes + retardos;
    return {
      attendance: {
        total,
        presentes,
        ausentes,
        retardos,
        justificados,
        porcentaje: asistibles > 0 ? Math.round(((presentes + retardos) / asistibles) * 100) : 0,
      },
      payments: { pagados, pendientes, vencidos, parciales },
      latestEvaluation,
    };
  },
};
