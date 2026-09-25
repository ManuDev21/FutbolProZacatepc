import { db } from '@/db/database';
import { nowISO, uuid } from '@/lib/utils';
import type { NotificationItem, NotificationKind } from '@/types';
import { effectiveStatus } from './payments.service';
import { toISODate } from '@/lib/utils';

export const notificationsService = {
  list(): Promise<NotificationItem[]> {
    return db.notifications
      .toArray()
      .then((a) => a.sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 50));
  },

  unreadCount(): Promise<number> {
    return db.notifications.filter((n) => !n.read).count();
  },

  async markRead(id: string): Promise<void> {
    await db.notifications.update(id, { read: true, updatedAt: nowISO() });
  },

  async markAllRead(): Promise<void> {
    const unread = await db.notifications.filter((n) => !n.read).toArray();
    await db.notifications.bulkPut(unread.map((n) => ({ ...n, read: true, updatedAt: nowISO() })));
  },

  async push(kind: NotificationKind, key: string, title: string, message: string, link?: string) {
    const existing = await db.notifications.where('key').equals(key).first();
    if (existing) return;
    await db.notifications.add({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      key,
      kind,
      title,
      message,
      read: false,
      link,
    });
  },

  /** Recalcula notificaciones del sistema: pagos, entrenamientos, evaluaciones. */
  async recompute(): Promise<void> {
    const [payments, players, trainings] = await Promise.all([
      db.payments.toArray(),
      db.players.toArray(),
      db.trainings.toArray(),
    ]);

    const pendientes = payments.filter((p) => effectiveStatus(p) === 'pendiente');
    const vencidos = payments.filter((p) => effectiveStatus(p) === 'vencido');
    const period = new Date().toISOString().slice(0, 7);
    const pendMes = pendientes.filter((p) => p.period === period);

    if (pendMes.length > 0) {
      await this.push(
        'pago',
        `pendientes-${period}`,
        `${pendMes.length} mensualidades pendientes`,
        `Hay ${pendMes.length} mensualidades sin cobrar en el periodo actual.`,
        '/app/pagos?estado=pendiente',
      );
    }
    if (vencidos.length > 0) {
      await this.push(
        'pago',
        'vencidos-actuales',
        `${vencidos.length} pagos vencidos`,
        `Se acumulan ${vencidos.length} cargos vencidos. Revisa la lista de pagos.`,
        '/app/pagos?estado=vencido',
      );
    }

    const today = toISODate(new Date());
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const soonStr = toISODate(soon);
    const proximos = trainings.filter((t) => t.date >= today && t.date <= soonStr);
    if (proximos.length > 0) {
      await this.push(
        'entrenamiento',
        `entrenamientos-${today}`,
        'Entrenamientos próximos',
        `${proximos.length} sesión(es) programada(s) en las próximas 48 h.`,
        '/app/entrenamientos',
      );
    }

    const evaluated = new Set(
      (await db.evaluations.toArray()).map((e) => `${e.playerId}|${e.date.slice(0, 7)}`),
    );
    const sinEvaluar = players.filter((p) => p.status === 'activo' && !evaluated.has(`${p.id}|${period}`));
    if (sinEvaluar.length > 0 && sinEvaluar.length <= 30) {
      await this.push(
        'evaluacion',
        `evaluaciones-${period}`,
        `${sinEvaluar.length} evaluaciones pendientes`,
        `${sinEvaluar.length} jugadores activos sin evaluación este mes.`,
        '/app/evaluaciones',
      );
    }
  },
};
