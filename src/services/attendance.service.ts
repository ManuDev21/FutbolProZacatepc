import { db } from '@/db/database';
import type { Attendance, AttendanceRecord } from '@/types';
import { createCrudService } from './base';
import { auditService } from './audit.service';

const crud = createCrudService(db.attendances, 'asistencia');

export const attendanceService = {
  ...crud,

  /** Busca si ya existe una toma de asistencia para categoría+fecha. */
  findSession(categoryId: string, date: string) {
    return db.attendances
      .where('categoryId')
      .equals(categoryId)
      .filter((a) => a.date === date)
      .first();
  },

  /** Guarda (crea o reemplaza) la lista de asistencia de una sesión. */
  async saveSession(
    session: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string,
  ): Promise<Attendance> {
    if (existingId) {
      await db.attendances.update(existingId, {
        ...session,
        updatedAt: new Date().toISOString(),
      });
      await auditService.log('actualizar', 'asistencia', existingId);
      return (await db.attendances.get(existingId))!;
    }
    return crud.create(session);
  },

  async updateRecord(attendanceId: string, record: AttendanceRecord): Promise<void> {
    const att = await db.attendances.get(attendanceId);
    if (!att) return;
    const idx = att.records.findIndex((r) => r.playerId === record.playerId);
    if (idx >= 0) att.records[idx] = record;
    else att.records.push(record);
    await db.attendances.update(attendanceId, {
      records: att.records,
      updatedAt: new Date().toISOString(),
    });
    await auditService.log('actualizar', 'asistencia', attendanceId, `Registro ${record.status}`);
  },

  /** Totales por estado para una fecha concreta (dashboard "asistencia del día"). */
  async dayTotals(date: string) {
    const sessions = await db.attendances.where('date').equals(date).toArray();
    const totals = { presente: 0, ausente: 0, retardo: 0, justificado: 0 };
    for (const s of sessions) {
      for (const r of s.records) totals[r.status]++;
    }
    return { sessions: sessions.length, ...totals };
  },
};
