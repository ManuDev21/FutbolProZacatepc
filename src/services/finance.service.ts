import { db } from '@/db/database';
import { todayISO, toPeriod } from '@/lib/utils';
import type { FinanceMovement, FinanceType } from '@/types';
import { createCrudService } from './base';
import { auditService } from './audit.service';

const crud = createCrudService(db.finance, 'movimiento');

export const financeService = {
  ...crud,

  async registerIncome(
    data: Omit<FinanceMovement, 'id' | 'createdAt' | 'updatedAt' | 'type'>,
  ): Promise<FinanceMovement> {
    return crud.create({ ...data, type: 'ingreso' });
  },

  async registerExpense(
    data: Omit<FinanceMovement, 'id' | 'createdAt' | 'updatedAt' | 'type'>,
  ): Promise<FinanceMovement> {
    await auditService.log('registrar-gasto', 'finanza');
    return crud.create({ ...data, type: 'gasto' });
  },

  async summary() {
    const all = await db.finance.toArray();
    const today = todayISO();
    const period = toPeriod(new Date());
    let ingresos = 0,
      gastos = 0,
      ingresosHoy = 0,
      ingresosMes = 0,
      gastosMes = 0;
    for (const m of all) {
      if (m.type === 'ingreso') {
        ingresos += m.amount;
        if (m.date === today) ingresosHoy += m.amount;
        if (m.date?.startsWith(period)) ingresosMes += m.amount;
      } else {
        gastos += m.amount;
        if (m.date?.startsWith(period)) gastosMes += m.amount;
      }
    }
    return {
      ingresos,
      gastos,
      ingresosHoy,
      ingresosMes,
      gastosMes,
      balance: ingresos - gastos,
      balanceMes: ingresosMes - gastosMes,
    };
  },

  /** Serie mensual ingresos/gastos para gráficas. */
  async monthlySeries(months = 6) {
    const all = await db.finance.toArray();
    const now = new Date();
    const points: { period: string; label: string; ingresos: number; gastos: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = toPeriod(d);
      const label = d.toLocaleDateString('es-MX', { month: 'short' });
      let ingresos = 0,
        gastos = 0;
      for (const m of all) {
        if (!m.date?.startsWith(period)) continue;
        if (m.type === 'ingreso') ingresos += m.amount;
        else gastos += m.amount;
      }
      points.push({ period, label, ingresos, gastos });
    }
    return points;
  },

  async byCategoryLabel(type: FinanceType) {
    const all = await db.finance.filter((m) => m.type === type).toArray();
    const map: Record<string, number> = {};
    for (const m of all) map[m.categoryLabel ?? 'Otros'] = (map[m.categoryLabel ?? 'Otros'] ?? 0) + m.amount;
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },
};
