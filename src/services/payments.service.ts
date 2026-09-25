import { db } from '@/db/database';
import { nowISO, toISODate, todayISO } from '@/lib/utils';
import type { Payment, PaymentMethod, PaymentStatus } from '@/types';
import { createCrudService } from './base';
import { auditService } from './audit.service';
import { settingsService } from './settings.service';
import { financeService } from './finance.service';

const crud = createCrudService(db.payments, 'pago');

/** Estado efectivo: un pendiente/parcial vencido se muestra como vencido. */
export function effectiveStatus(p: Payment): PaymentStatus {
  if (p.status === 'pagado') return 'pagado';
  if (p.dueDate < todayISO()) return 'vencido';
  return p.status;
}

export const paymentsService = {
  ...crud,

  forPlayer(playerId: string): Promise<Payment[]> {
    return db.payments.where('playerId').equals(playerId).sortBy('dueDate');
  },

  /** Marca como vencidos los pendientes/parciales cuya fecha límite ya pasó. */
  async refreshOverdue(): Promise<number> {
    const today = todayISO();
    const stale = await db.payments
      .where('status')
      .anyOf('pendiente', 'parcial')
      .filter((p) => p.dueDate < today)
      .toArray();
    if (stale.length === 0) return 0;
    await db.payments.bulkPut(stale.map((p) => ({ ...p, status: 'vencido' as const, updatedAt: nowISO() })));
    return stale.length;
  },

  /** Registra el cobro de una mensualidad (total o parcial). */
  async registerPayment(
    id: string,
    opts: { paidAt?: string; method?: PaymentMethod; amountPaid?: number },
  ): Promise<void> {
    const p = await db.payments.get(id);
    if (!p) return;
    const amountPaid = opts.amountPaid ?? p.amount;
    const status: PaymentStatus = amountPaid >= p.amount ? 'pagado' : 'parcial';
    await db.payments.update(id, {
      status,
      amountPaid,
      paidAt: opts.paidAt ?? toISODate(new Date()),
      method: opts.method ?? 'efectivo',
      updatedAt: nowISO(),
    });
    await auditService.log('registrar-pago', 'pago', id, `${status} $${amountPaid}`);
    // Reflejar el ingreso en finanzas
    if (amountPaid > 0) {
      await financeService.registerIncome({
        concept: p.concept,
        amount: amountPaid,
        date: opts.paidAt ?? toISODate(new Date()),
        method: opts.method ?? 'efectivo',
        categoryLabel: 'Mensualidades',
        paymentId: p.id,
        description: `Cobro de ${p.concept}${p.period ? ` (${p.period})` : ''}`,
      });
    }
  },

  /**
   * Genera las mensualidades del periodo para jugadores activos.
   * No duplica cargos ya existentes (jugador+periodo+concepto).
   */
  async generateMonthly(period: string, onlyCategoryId?: string): Promise<number> {
    const school = await settingsService.getSchool();
    const amount = school?.monthlyFee ?? 500;
    const dueDate = `${period}-10`;
    const players = await db.players
      .filter((p) => p.status === 'activo' && (!onlyCategoryId || p.categoryId === onlyCategoryId))
      .toArray();
    const existing = await db.payments.where('period').equals(period).toArray();
    const existingKeys = new Set(existing.map((e) => `${e.playerId}|${e.concept}`));
    const toCreate = players
      .filter((p) => !existingKeys.has(`${p.id}|Mensualidad`))
      .map((p) => ({
        playerId: p.id,
        concept: 'Mensualidad',
        period,
        amount,
        dueDate,
        status: (dueDate < todayISO() ? 'vencido' : 'pendiente') as PaymentStatus,
      }));
    if (toCreate.length > 0) await crud.bulkCreate(toCreate);
    return toCreate.length;
  },

  async summary() {
    const all = await db.payments.toArray();
    const s = { pagado: 0, pendiente: 0, vencido: 0, parcial: 0, cobrado: 0, porCobrar: 0 };
    for (const p of all) {
      const st = effectiveStatus(p);
      s[st]++;
      if (st === 'pagado' || st === 'parcial') s.cobrado += p.amountPaid ?? 0;
      if (st !== 'pagado') s.porCobrar += p.amount - (p.amountPaid ?? 0);
    }
    return s;
  },
};
