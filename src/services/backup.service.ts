import * as XLSX from 'xlsx';
import { db } from '@/db/database';
import { downloadFile, nowISO, toISODate } from '@/lib/utils';
import type { BaseEntity } from '@/types';
import { auditService } from './audit.service';
import { settingsService, SETTINGS_KEYS } from './settings.service';

const TABLES = [
  'settings',
  'users',
  'schools',
  'coaches',
  'categories',
  'players',
  'guardians',
  'teams',
  'attendances',
  'trainings',
  'exercises',
  'evaluations',
  'payments',
  'finance',
  'notifications',
  'reports',
  'events',
  'audit_logs',
  'lineups',
  'caor_plays',
  'caor_plans',
  'caor_rivals',
  'caor_tests',
  'caor_profiles',
] as const;

export interface BackupFile {
  meta: { app: string; version: number; exportedAt: string };
  data: Record<string, BaseEntity[]>;
}

export interface ImportSummary {
  valid: boolean;
  error?: string;
  counts: Record<string, number>;
  exportedAt?: string;
}

export const backupService = {
  /** Exporta toda la base a un JSON descargable. */
  async exportJson(): Promise<void> {
    const data: Record<string, BaseEntity[]> = {};
    for (const t of TABLES) {
      data[t] = (await db.table(t).toArray()) as BaseEntity[];
    }
    const payload: BackupFile = {
      meta: { app: 'futbolprozacatepec', version: 1, exportedAt: nowISO() },
      data,
    };
    downloadFile(JSON.stringify(payload, null, 2), `futbolprozacatepec-backup-${toISODate(new Date())}.json`);
    await settingsService.setSetting(SETTINGS_KEYS.lastBackupAt, nowISO());
    await auditService.log('exportar', 'datos', undefined, 'Backup JSON completo');
  },

  /** Lee y valida un archivo de respaldo sin aplicar cambios. */
  async inspectJson(file: File): Promise<ImportSummary> {
    let parsed: BackupFile;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return { valid: false, error: 'El archivo no es un JSON válido.', counts: {} };
    }
    if (parsed?.meta?.app !== 'futbolprozacatepec' || typeof parsed.data !== 'object') {
      return {
        valid: false,
        error: 'El archivo no corresponde a un respaldo de FútbolProZacatepec.',
        counts: {},
      };
    }
    const counts: Record<string, number> = {};
    for (const [table, rows] of Object.entries(parsed.data)) {
      if (Array.isArray(rows)) counts[table] = rows.length;
    }
    return { valid: true, counts, exportedAt: parsed.meta.exportedAt };
  },

  /** Restaura un respaldo: reemplaza el contenido actual de las tablas. */
  async importJson(file: File): Promise<ImportSummary> {
    const summary = await this.inspectJson(file);
    if (!summary.valid) return summary;
    const parsed = JSON.parse(await file.text()) as BackupFile;
    await db.transaction('rw', db.tables, async () => {
      for (const t of TABLES) {
        const rows = parsed.data[t];
        await db.table(t).clear();
        if (Array.isArray(rows) && rows.length > 0) {
          await db.table(t).bulkAdd(rows);
        }
      }
    });
    await auditService.log('importar', 'datos', undefined, `Restauración ${summary.exportedAt ?? ''}`);
    return summary;
  },

  /** Restablece solo algunas colecciones desde un respaldo (merge). */
  async mergeJson(file: File): Promise<ImportSummary> {
    const summary = await this.inspectJson(file);
    if (!summary.valid) return summary;
    const parsed = JSON.parse(await file.text()) as BackupFile;
    for (const t of TABLES) {
      const rows = parsed.data[t];
      if (Array.isArray(rows) && rows.length > 0) {
        await db.table(t).bulkPut(rows);
      }
    }
    await auditService.log('fusionar', 'datos', undefined, 'Importación combinada');
    return summary;
  },

  /** Exporta una colección a Excel (.xlsx). */
  async exportExcel(
    kind: 'jugadores' | 'pagos' | 'asistencias' | 'finanzas' | 'evaluaciones' | 'ejercicios',
  ): Promise<void> {
    const wb = XLSX.utils.book_new();
    const addSheet = (name: string, rows: Record<string, unknown>[]) => {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ info: 'sin datos' }]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    };

    const players = await db.players.toArray();
    const categories = await db.categories.toArray();
    const catName = (id?: string) => categories.find((c) => c.id === id)?.name ?? '';

    if (kind === 'jugadores') {
      addSheet(
        'Jugadores',
        players.map((p) => ({
          Nombre: `${p.firstName} ${p.lastName}`,
          Categoría: catName(p.categoryId),
          'Fecha Nac.': p.birthDate,
          Posición: p.position ?? '',
          Número: p.jerseyNumber ?? '',
          Estado: p.status,
          Ingreso: p.joinedAt,
          Teléfono: p.phone ?? '',
        })),
      );
    } else if (kind === 'pagos') {
      const name = (id: string) => {
        const p = players.find((x) => x.id === id);
        return p ? `${p.firstName} ${p.lastName}` : '';
      };
      addSheet(
        'Pagos',
        (await db.payments.toArray()).map((p) => ({
          Jugador: name(p.playerId),
          Concepto: p.concept,
          Periodo: p.period ?? '',
          Monto: p.amount,
          'Monto pagado': p.amountPaid ?? 0,
          Vence: p.dueDate,
          'Fecha pago': p.paidAt ?? '',
          Estado: p.status,
          Método: p.method ?? '',
        })),
      );
    } else if (kind === 'asistencias') {
      const name = (id: string) => {
        const p = players.find((x) => x.id === id);
        return p ? `${p.firstName} ${p.lastName}` : '';
      };
      const rows: Record<string, unknown>[] = [];
      for (const a of await db.attendances.toArray()) {
        for (const r of a.records) {
          rows.push({
            Fecha: a.date,
            Categoría: catName(a.categoryId),
            Jugador: name(r.playerId),
            Estado: r.status,
            Hora: r.time ?? '',
          });
        }
      }
      addSheet('Asistencias', rows);
    } else if (kind === 'finanzas') {
      addSheet(
        'Finanzas',
        (await db.finance.toArray()).map((m) => ({
          Tipo: m.type,
          Concepto: m.concept,
          Categoría: m.categoryLabel ?? '',
          Monto: m.amount,
          Fecha: m.date,
          Método: m.method ?? '',
          Descripción: m.description ?? '',
        })),
      );
    } else if (kind === 'evaluaciones') {
      const name = (id: string) => {
        const p = players.find((x) => x.id === id);
        return p ? `${p.firstName} ${p.lastName}` : '';
      };
      addSheet(
        'Evaluaciones',
        (await db.evaluations.toArray()).map((e) => ({
          Jugador: name(e.playerId),
          Fecha: e.date,
          Periodo: e.label ?? e.period,
          Técnica: e.scores.tecnica,
          Velocidad: e.scores.velocidad,
          Táctica: e.scores.tactica,
          Físico: e.scores.fisico,
          Actitud: e.scores.actitud,
        })),
      );
    } else {
      addSheet(
        'Ejercicios',
        (await db.exercises.toArray()).map((e) => ({
          Código: e.code,
          Nombre: e.name,
          Área: e.area ?? '',
          Objetivo: e.objective ?? '',
          Dificultad: e.difficulty,
          'Edad min': e.minAge ?? '',
          'Edad max': e.maxAge ?? '',
          'Duración (min)': e.durationMin ?? '',
        })),
      );
    }

    XLSX.writeFile(wb, `futbolprozacatepec-${kind}-${toISODate(new Date())}.xlsx`);
    await auditService.log('exportar', 'datos', undefined, `Excel ${kind}`);
  },

  /** Borra TODOS los datos (doble confirmación en UI). */
  async wipeAll(): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      for (const t of db.tables) await t.clear();
    });
  },
};
