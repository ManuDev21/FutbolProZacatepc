import { describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { playersService } from '@/services/players.service';
import { categoriesService } from '@/services/categories.service';
import { paymentsService, effectiveStatus } from '@/services/payments.service';
import { evaluationsService } from '@/services/evaluations.service';
import { attendanceService } from '@/services/attendance.service';
import { financeService } from '@/services/finance.service';
import { exercisesService } from '@/services/exercises.service';
import { authService } from '@/services/auth.service';
import { settingsService } from '@/services/settings.service';
import { todayISO, toPeriod } from '@/lib/utils';
import type { Payment } from '@/types';

const base = { createdAt: '', updatedAt: '', id: '' };

describe('playersService', () => {
  it('crea, lee, actualiza y elimina jugadores', async () => {
    const p = await playersService.create({
      ...base,
      firstName: 'Mateo',
      lastName: 'Hernández',
      birthDate: '2015-05-10',
      status: 'activo',
      joinedAt: todayISO(),
    });
    expect(p.id).toBeTruthy();
    expect(await playersService.count()).toBe(1);

    await playersService.update(p.id, { jerseyNumber: 10 });
    expect((await playersService.getById(p.id))?.jerseyNumber).toBe(10);

    await playersService.remove(p.id);
    expect(await playersService.count()).toBe(0);
  });

  it('registra acciones en audit_logs', async () => {
    const p = await playersService.create({
      ...base,
      firstName: 'Ana',
      lastName: 'Ruiz',
      birthDate: '2014-01-01',
      status: 'activo',
      joinedAt: todayISO(),
    });
    const logs = await db.audit_logs.toArray();
    expect(logs.some((l) => l.entity === 'jugador' && l.entityId === p.id)).toBe(true);
  });
});

describe('categoriesService', () => {
  it('cuenta jugadores por categoría', async () => {
    const cat = await categoriesService.create({
      ...base,
      name: 'Sub-7',
      minAge: 5,
      maxAge: 8,
      format: 7,
      active: true,
    });
    await playersService.create({
      ...base,
      firstName: 'Luis',
      lastName: 'Paz',
      birthDate: '2018-01-01',
      categoryId: cat.id,
      status: 'activo',
      joinedAt: todayISO(),
    });
    const counts = await categoriesService.playerCounts();
    expect(counts[cat.id]).toBe(1);
  });
});

describe('paymentsService', () => {
  it('genera mensualidades sin duplicar', async () => {
    const cat = await categoriesService.create({
      ...base,
      name: 'Sub-13',
      minAge: 9,
      maxAge: 14,
      format: 7,
      active: true,
    });
    await settingsService.saveSchool({ monthlyFee: 500 });
    const p = await playersService.create({
      ...base,
      firstName: 'Iker',
      lastName: 'López',
      birthDate: '2012-03-01',
      categoryId: cat.id,
      status: 'activo',
      joinedAt: todayISO(),
    });

    // Periodo futuro → mensualidad nace como "pendiente" (no vencida)
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    const period = toPeriod(next);
    const created = await paymentsService.generateMonthly(period);
    expect(created).toBe(1);
    const again = await paymentsService.generateMonthly(period);
    expect(again).toBe(0);

    const list = await paymentsService.forPlayer(p.id);
    expect(list).toHaveLength(1);
    expect(list[0].amount).toBe(500);
    expect(list[0].status).toBe('pendiente');
  });

  it('registra cobro y lo refleja en finanzas', async () => {
    const p = await playersService.create({
      ...base,
      firstName: 'Ana',
      lastName: 'Gil',
      birthDate: '2011-01-01',
      status: 'activo',
      joinedAt: todayISO(),
    });
    const payment = await paymentsService.create({
      ...base,
      playerId: p.id,
      concept: 'Mensualidad',
      amount: 500,
      dueDate: todayISO(),
      status: 'pendiente',
    });
    await paymentsService.registerPayment(payment.id, { amountPaid: 500, method: 'efectivo' });
    const updated = await paymentsService.getById(payment.id);
    expect(updated?.status).toBe('pagado');
    const finance = await db.finance.toArray();
    expect(finance.some((m) => m.type === 'ingreso' && m.amount === 500 && m.paymentId === payment.id)).toBe(
      true,
    );
  });

  it('pago parcial queda como parcial', async () => {
    const p = await playersService.create({
      ...base,
      firstName: 'Bob',
      lastName: 'Gil',
      birthDate: '2011-01-01',
      status: 'activo',
      joinedAt: todayISO(),
    });
    const payment = await paymentsService.create({
      ...base,
      playerId: p.id,
      concept: 'Mensualidad',
      amount: 500,
      dueDate: todayISO(),
      status: 'pendiente',
    });
    await paymentsService.registerPayment(payment.id, { amountPaid: 200 });
    const updated = await paymentsService.getById(payment.id);
    expect(updated?.status).toBe('parcial');
    expect(updated?.amountPaid).toBe(200);
  });

  it('effectiveStatus marca vencido un pendiente pasado de fecha', () => {
    const p = {
      status: 'pendiente',
      dueDate: '2020-01-01',
    } as unknown as Payment;
    expect(effectiveStatus(p)).toBe('vencido');
  });
});

describe('attendanceService', () => {
  it('guarda y recarga una sesión de asistencia', async () => {
    const cat = await categoriesService.create({
      ...base,
      name: 'Sub-17',
      minAge: 15,
      maxAge: 18,
      format: 11,
      active: true,
    });
    const p1 = await playersService.create({
      ...base,
      firstName: 'A',
      lastName: 'Uno',
      birthDate: '2008-01-01',
      categoryId: cat.id,
      status: 'activo',
      joinedAt: todayISO(),
    });
    const p2 = await playersService.create({
      ...base,
      firstName: 'B',
      lastName: 'Dos',
      birthDate: '2008-01-01',
      categoryId: cat.id,
      status: 'activo',
      joinedAt: todayISO(),
    });
    const saved = await attendanceService.saveSession({
      date: todayISO(),
      categoryId: cat.id,
      records: [
        { playerId: p1.id, status: 'presente' },
        { playerId: p2.id, status: 'retardo', time: '17:10' },
      ],
    });
    const found = await attendanceService.findSession(cat.id, todayISO());
    expect(found?.id).toBe(saved.id);
    const totals = await attendanceService.dayTotals(todayISO());
    expect(totals.presente).toBe(1);
    expect(totals.retardo).toBe(1);
  });
});

describe('evaluationsService', () => {
  it('devuelve historial ordenado y último par', async () => {
    const p = await playersService.create({
      ...base,
      firstName: 'E',
      lastName: 'Val',
      birthDate: '2010-01-01',
      status: 'activo',
      joinedAt: todayISO(),
    });
    const mk = (date: string) => ({
      ...base,
      playerId: p.id,
      date,
      period: 'mensual' as const,
      scores: { tecnica: 60, velocidad: 60, tactica: 60, fisico: 60, actitud: 60 },
    });
    await evaluationsService.create(mk('2026-01-10'));
    await evaluationsService.create(mk('2026-03-10'));
    const pair = await evaluationsService.latestPair(p.id);
    expect(pair.current?.date).toBe('2026-03-10');
    expect(pair.previous?.date).toBe('2026-01-10');
  });
});

describe('financeService', () => {
  it('calcula balance ingresos - gastos', async () => {
    await financeService.registerIncome({ concept: 'Mensualidad', amount: 500, date: todayISO() });
    await financeService.registerExpense({ concept: 'Balones', amount: 300, date: todayISO() });
    const s = await financeService.summary();
    expect(s.ingresos).toBe(500);
    expect(s.gastos).toBe(300);
    expect(s.balance).toBe(200);
  });
});

describe('exercisesService', () => {
  it('importa la biblioteca JSON una sola vez', async () => {
    const n1 = await exercisesService.importLibrary();
    expect(n1).toBeGreaterThan(1000);
    const n2 = await exercisesService.importLibrary();
    expect(n2).toBe(0);
  });
});

describe('authService', () => {
  it('crea usuarios por defecto y autentica', async () => {
    await authService.ensureDefaultUsers();
    const bad = await authService.login('admin', 'wrong');
    expect(bad).toBeNull();
    const ok = await authService.login('admin', 'admin123');
    expect(ok?.role).toBe('admin');
    await authService.logout();
  });
});
