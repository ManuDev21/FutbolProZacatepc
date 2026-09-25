import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { todayISO, toPeriod } from '@/lib/utils';
import { effectiveStatus } from '@/services/payments.service';
import { trainingDuration } from '@/services/trainings.service';
import type { PlayerStats } from '@/types';
import { playersService } from '@/services/players.service';
import { settingsService } from '@/services/settings.service';
import { financeService } from '@/services/finance.service';
import { notificationsService } from '@/services/notifications.service';
import { auditService } from '@/services/audit.service';
import { attendanceService } from '@/services/attendance.service';

// ---------- Catálogos ----------

export function useCategories() {
  return useLiveQuery(
    () => db.categories.toArray().then((a) => a.sort((x, y) => x.minAge - y.minAge)),
    [],
  );
}

export function usePlayers() {
  return useLiveQuery(() => db.players.toArray(), []);
}

export function usePlayer(id?: string) {
  return useLiveQuery(() => (id ? db.players.get(id).then((p) => p ?? null) : null), [id]);
}

export function useCoaches() {
  return useLiveQuery(() => db.coaches.toArray(), []);
}

export function useGuardians() {
  return useLiveQuery(() => db.guardians.toArray(), []);
}

export function useTeams() {
  return useLiveQuery(() => db.teams.toArray(), []);
}

export function useExercises() {
  return useLiveQuery(() => db.exercises.toArray(), []);
}

export function useTrainings() {
  return useLiveQuery(() => db.trainings.orderBy('date').reverse().toArray(), []);
}

export function useEvents() {
  return useLiveQuery(() => db.events.toArray(), []);
}

export function usePayments() {
  return useLiveQuery(async () => {
    const [payments, players] = await Promise.all([db.payments.toArray(), db.players.toArray()]);
    const name = new Map(players.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
    return payments.map((p) => ({
      ...p,
      playerName: name.get(p.playerId) ?? '—',
      effective: effectiveStatus(p),
    }));
  }, []);
}

export function useFinance() {
  return useLiveQuery(() => db.finance.toArray(), []);
}

export function useEvaluations(playerId?: string) {
  return useLiveQuery(
    () =>
      playerId ? db.evaluations.where('playerId').equals(playerId).sortBy('date') : db.evaluations.toArray(),
    [playerId],
  );
}

export function useAttendances() {
  return useLiveQuery(() => db.attendances.orderBy('date').reverse().toArray(), []);
}

export function useLineups(categoryId?: string) {
  return useLiveQuery(
    () => (categoryId ? db.lineups.where('categoryId').equals(categoryId).toArray() : db.lineups.toArray()),
    [categoryId],
  );
}

export function useNotifications() {
  return useLiveQuery(() => notificationsService.list(), []);
}

export function useUnreadCount() {
  return useLiveQuery(() => db.notifications.filter((n) => !n.read).count(), []);
}

export function useAuditLogs() {
  return useLiveQuery(() => auditService.list(300), []);
}

export function useUsers() {
  return useLiveQuery(() => db.users.toArray(), []);
}

export function useSchool() {
  return useLiveQuery(() => settingsService.getSchool(), []);
}

export function usePlayerStats(playerId?: string): PlayerStats | undefined {
  return useLiveQuery(() => (playerId ? playersService.stats(playerId) : undefined), [playerId]);
}

// ---------- Dashboard ----------

export interface DashboardStats {
  jugadoresActivos: number;
  categorias: number;
  entrenadores: number;
  asistenciaHoy: {
    sessions: number;
    presente: number;
    ausente: number;
    retardo: number;
    justificado: number;
  };
  pagosMes: { cobrado: number; porCobrar: number };
  pendientes: number;
  vencidos: number;
  ingresosMes: number;
  gastosMes: number;
  balance: number;
  proximosEntrenamientos: { id: string; name: string; date: string; duracion: number }[];
  asistenciaSemanal: { fecha: string; presente: number; ausente: number; retardo: number }[];
  pagosDonut: { name: string; value: number; color: string }[];
  rendimiento: { area: string; actual: number; anterior: number }[];
  finanzasMensual: { period: string; label: string; ingresos: number; gastos: number }[];
}

export function useDashboardStats(): DashboardStats | undefined {
  return useLiveQuery(async () => {
    const today = todayISO();
    const period = toPeriod(new Date());
    const [players, categories, coaches, attendances, payments, trainings, evaluations] = await Promise.all([
      db.players.toArray(),
      db.categories.toArray(),
      db.coaches.toArray(),
      db.attendances.toArray(),
      db.payments.toArray(),
      db.trainings.toArray(),
      db.evaluations.toArray(),
    ]);
    const financeSummary = await financeService.summary();
    const finanzasMensual = await financeService.monthlySeries(6);

    const asistenciaHoy = await attendanceService.dayTotals(today);

    let pendientes = 0,
      vencidos = 0,
      pagadosMes = 0,
      porCobrarMes = 0;
    let pagados = 0,
      parciales = 0;
    for (const p of payments) {
      const st = effectiveStatus(p);
      if (st === 'pendiente') pendientes++;
      else if (st === 'vencido') vencidos++;
      else if (st === 'pagado') pagados++;
      else parciales++;
      if (p.period === period) {
        if (st === 'pagado') pagadosMes += p.amountPaid ?? 0;
        else porCobrarMes += p.amount - (p.amountPaid ?? 0);
      }
    }

    // Asistencia últimos 14 días agrupada por fecha
    const from = new Date();
    from.setDate(from.getDate() - 13);
    const byDay = new Map<string, { presente: number; ausente: number; retardo: number }>();
    for (const a of attendances) {
      if (a.date < toISODateLocal(from) || a.date > today) continue;
      const e = byDay.get(a.date) ?? { presente: 0, ausente: 0, retardo: 0 };
      for (const r of a.records) {
        if (r.status === 'presente') e.presente++;
        else if (r.status === 'ausente') e.ausente++;
        else if (r.status === 'retardo') e.retardo++;
      }
      byDay.set(a.date, e);
    }
    const asistenciaSemanal = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, v]) => ({
        fecha: new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
        }),
        ...v,
      }));

    // Rendimiento promedio (última vs anterior evaluación por jugador)
    const byPlayer = new Map<string, typeof evaluations>();
    for (const e of evaluations) {
      const arr = byPlayer.get(e.playerId) ?? [];
      arr.push(e);
      byPlayer.set(e.playerId, arr);
    }
    const areas = ['tecnica', 'velocidad', 'tactica', 'fisico', 'actitud'] as const;
    const acc = areas.map((a) => ({ area: a, cur: 0, prev: 0, curN: 0, prevN: 0 }));
    for (const list of byPlayer.values()) {
      list.sort((a, b) => a.date.localeCompare(b.date));
      const cur = list.at(-1);
      const prev = list.at(-2);
      areas.forEach((a, i) => {
        if (cur) {
          acc[i].cur += cur.scores[a];
          acc[i].curN++;
        }
        if (prev) {
          acc[i].prev += prev.scores[a];
          acc[i].prevN++;
        }
      });
    }
    const rendimiento = acc.map((a) => ({
      area: a.area.charAt(0).toUpperCase() + a.area.slice(1),
      actual: a.curN ? Math.round(a.cur / a.curN) : 0,
      anterior: a.prevN ? Math.round(a.prev / a.prevN) : 0,
    }));

    const proximosEntrenamientos = trainings
      .filter((t) => t.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map((t) => ({ id: t.id, name: t.name, date: t.date, duracion: trainingDuration(t) }));

    return {
      jugadoresActivos: players.filter((p) => p.status === 'activo').length,
      categorias: categories.filter((c) => c.active).length,
      entrenadores: coaches.filter((c) => c.active).length,
      asistenciaHoy,
      pagosMes: { cobrado: pagadosMes, porCobrar: porCobrarMes },
      pendientes,
      vencidos,
      ingresosMes: financeSummary.ingresosMes,
      gastosMes: financeSummary.gastosMes,
      balance: financeSummary.balance,
      proximosEntrenamientos,
      asistenciaSemanal,
      pagosDonut: [
        { name: 'Pagados', value: pagados, color: '#177541' },
        { name: 'Pendientes', value: pendientes, color: '#f5a801' },
        { name: 'Vencidos', value: vencidos, color: '#dc2626' },
        { name: 'Parciales', value: parciales, color: '#2563eb' },
      ],
      rendimiento,
      finanzasMensual,
    } satisfies DashboardStats;
  }, []);
}

function toISODateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
