import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarPlus,
  CreditCard,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  HandCoins,
  Clock,
} from 'lucide-react';
import { useCategories, useGuardians, usePayments, usePlayers, useSchool } from '@/hooks/useData';
import { paymentsService } from '@/services/payments.service';
import { openWhatsApp, paymentReminderMessage, paymentConfirmMessage } from '@/services/whatsapp.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Pagination, SearchInput, TableSkeleton } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { StatCard } from '@/components/dashboard/StatCard';
import { paymentSchema, type PaymentForm } from '@/lib/validators';
import {
  formatCurrency,
  formatDate,
  fullName,
  matchesSearch,
  periodLabel,
  toPeriod,
  todayISO,
} from '@/lib/utils';
import type { Payment, PaymentMethod } from '@/types';

const PAGE_SIZE = 12;

export default function PaymentsPage() {
  const payments = usePayments();
  const players = usePlayers();
  const categories = useCategories();
  const guardians = useGuardians();
  const school = useSchool();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState(params.get('estado') ?? '');
  const [periodo, setPeriodo] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; payment?: Payment | null }>({ open: false });
  const [genOpen, setGenOpen] = useState(false);
  const [payModal, setPayModal] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [genBusy, setGenBusy] = useState(false);

  // Cobro form state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('efectivo');

  const [genPeriod, setGenPeriod] = useState(toPeriod(new Date()));
  const [genCategory, setGenCategory] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema) });

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.payment
          ? {
              playerId: modal.payment.playerId,
              concept: modal.payment.concept,
              period: modal.payment.period ?? '',
              amount: modal.payment.amount,
              dueDate: modal.payment.dueDate,
              notes: modal.payment.notes ?? '',
            }
          : { concept: 'Mensualidad', dueDate: todayISO() },
      );
    }
  }, [modal.open, modal.payment, reset]);

  useEffect(() => {
    paymentsService.refreshOverdue().catch(() => {});
  }, []);

  const periods = useMemo(
    () => [...new Set((payments ?? []).map((p) => p.period).filter(Boolean))].sort().reverse() as string[],
    [payments],
  );

  const filtered = useMemo(() => {
    let list = payments ?? [];
    if (search.trim()) list = list.filter((p) => matchesSearch([p.playerName, p.concept, p.period], search));
    if (estado) list = list.filter((p) => p.effective === estado);
    if (periodo) list = list.filter((p) => p.period === periodo);
    return [...list].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [payments, search, estado, periodo]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(() => {
    const t = { cobrado: 0, pendiente: 0, vencido: 0 };
    for (const p of payments ?? []) {
      if (p.effective === 'pagado' || p.effective === 'parcial') t.cobrado += p.amountPaid ?? 0;
      if (p.effective === 'pendiente') t.pendiente += p.amount;
      if (p.effective === 'vencido') t.vencido += p.amount - (p.amountPaid ?? 0);
    }
    return t;
  }, [payments]);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      const payload = { ...data, period: data.period || undefined };
      if (modal.payment) {
        await paymentsService.update(modal.payment.id, payload);
        toast.success('Pago actualizado');
      } else {
        await paymentsService.create({ ...payload, status: 'pendiente' });
        toast.success('Cargo creado');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  const generate = async () => {
    setGenBusy(true);
    try {
      const n = await paymentsService.generateMonthly(genPeriod, genCategory || undefined);
      toast.success(
        n > 0 ? `${n} mensualidades generadas` : 'Sin cargos nuevos',
        `${periodLabel(genPeriod)}`,
      );
      setGenOpen(false);
    } catch {
      toast.error('No se pudieron generar las mensualidades');
    } finally {
      setGenBusy(false);
    }
  };

  const remove = async (p: Payment & { playerName?: string }) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar cargo',
        message: `¿Eliminar "${p.concept}" de ${(p as { playerName?: string }).playerName}?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await paymentsService.remove(p.id);
    toast.success('Cargo eliminado');
  };

  const confirmPay = async () => {
    if (!payModal) return;
    setSaving(true);
    try {
      await paymentsService.registerPayment(payModal.id, {
        amountPaid: Number(payAmount) || payModal.amount,
        method: payMethod,
      });
      toast.success('Pago registrado', formatCurrency(Number(payAmount) || payModal.amount));
      setPayModal(null);
    } catch {
      toast.error('No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  const remindWa = (p: Payment & { playerName?: string }) => {
    const player = players?.find((x) => x.id === p.playerId);
    const guardian =
      guardians?.find((g) => g.id === player?.guardianId) ??
      guardians?.find((g) => g.playerIds.includes(p.playerId));
    if (!player) return;
    const phone = guardian?.whatsapp ?? guardian?.phone ?? player.phone;
    if (!phone) {
      toast.warning('Sin WhatsApp', 'El jugador no tiene tutor con número registrado.');
      return;
    }
    openWhatsApp(phone, paymentReminderMessage(guardian, player, p));
  };

  const confirmWa = (p: Payment) => {
    const player = players?.find((x) => x.id === p.playerId);
    const guardian = guardians?.find((g) => g.playerIds.includes(p.playerId) || g.id === player?.guardianId);
    if (!player) return;
    const phone = guardian?.whatsapp ?? guardian?.phone ?? player.phone;
    if (!phone) return toast.warning('Sin WhatsApp del tutor');
    openWhatsApp(phone, paymentConfirmMessage(player, p));
  };

  return (
    <div>
      <PageHeader
        title="Pagos y mensualidades"
        subtitle={`Mensualidad: ${formatCurrency(school?.monthlyFee ?? 0)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setGenOpen(true)}>
              <CalendarPlus className="h-4 w-4" /> Generar mensualidades
            </Button>
            <Button onClick={() => setModal({ open: true, payment: null })}>
              <Plus className="h-4 w-4" /> Nuevo cargo
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard icon={HandCoins} label="Cobrado" value={formatCurrency(totals.cobrado)} tone="brand" />
        <StatCard icon={Clock} label="Por cobrar" value={formatCurrency(totals.pendiente)} tone="gold" />
        <StatCard icon={CreditCard} label="Vencido" value={formatCurrency(totals.vencido)} tone="red" />
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Buscar jugador o concepto..."
            className="min-w-52 flex-1"
          />
          <Select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(1);
              if (e.target.value) setParams({ estado: e.target.value });
              else setParams({});
            }}
            className="w-36"
          >
            <option value="">Todos</option>
            <option value="pagado">Pagados</option>
            <option value="pendiente">Pendientes</option>
            <option value="vencido">Vencidos</option>
            <option value="parcial">Parciales</option>
          </Select>
          <Select
            value={periodo}
            onChange={(e) => {
              setPeriodo(e.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">Todos los periodos</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {periodLabel(p)}
              </option>
            ))}
          </Select>
        </div>

        {!payments ? (
          <TableSkeleton />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-10 w-10" />}
            title="Sin pagos"
            message="Genera las mensualidades del periodo o crea un cargo manual."
            action={
              <Button size="sm" onClick={() => setGenOpen(true)}>
                <CalendarPlus className="h-4 w-4" /> Generar mensualidades
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Jugador</Th>
                  <Th>Concepto</Th>
                  <Th>Periodo</Th>
                  <Th>Monto</Th>
                  <Th>Vence</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </THead>
              <TBody>
                {pageItems.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.playerName}</Td>
                    <Td>{p.concept}</Td>
                    <Td className="text-zinc-500">{p.period ? periodLabel(p.period) : '—'}</Td>
                    <Td>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      {p.status === 'parcial' && (
                        <p className="text-[11px] text-blue-500">
                          abonado {formatCurrency(p.amountPaid ?? 0)}
                        </p>
                      )}
                    </Td>
                    <Td className="text-zinc-500">{formatDate(p.dueDate)}</Td>
                    <Td>
                      <StatusBadge status={p.effective} />
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1">
                        {p.effective !== 'pagado' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setPayModal(p);
                                setPayAmount(String(p.amount - (p.amountPaid ?? 0)));
                                setPayMethod('efectivo');
                              }}
                            >
                              Cobrar
                            </Button>
                            <Button
                              variant="whatsapp"
                              size="icon"
                              title="Recordar por WhatsApp"
                              onClick={() => remindWa(p)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {p.effective === 'pagado' && (
                          <Button
                            variant="whatsapp"
                            size="icon"
                            title="Confirmar por WhatsApp"
                            onClick={() => confirmWa(p)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModal({ open: true, payment: p })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </Card>

      {/* Modal nuevo/editar cargo */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.payment ? 'Editar cargo' : 'Nuevo cargo'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Jugador" required error={errors.playerId?.message}>
            <Select {...register('playerId')}>
              <option value="">Seleccionar...</option>
              {players?.map((p) => (
                <option key={p.id} value={p.id}>
                  {fullName(p)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Concepto" required error={errors.concept?.message}>
              <Input {...register('concept')} placeholder="Mensualidad" />
            </Field>
            <Field label="Periodo" error={errors.period?.message}>
              <Input type="month" {...register('period')} />
            </Field>
            <Field label="Monto" required error={errors.amount?.message}>
              <Input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                placeholder="500"
              />
            </Field>
            <Field label="Fecha de vencimiento" required error={errors.dueDate?.message}>
              <Input type="date" {...register('dueDate')} />
            </Field>
          </div>
          <Field label="Observaciones" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </Field>
        </div>
      </Modal>

      {/* Modal generar mensualidades */}
      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Generar mensualidades"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={generate} loading={genBusy}>
              Generar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Se creará un cargo de {formatCurrency(school?.monthlyFee ?? 0)} para cada jugador activo del
            periodo seleccionado (sin duplicar existentes).
          </p>
          <Field label="Periodo" required>
            <Input type="month" value={genPeriod} onChange={(e) => setGenPeriod(e.target.value)} />
          </Field>
          <Field label="Categoría (opcional)">
            <Select value={genCategory} onChange={(e) => setGenCategory(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      {/* Modal cobrar */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title="Registrar cobro"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModal(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmPay} loading={saving}>
              Confirmar cobro
            </Button>
          </>
        }
      >
        {payModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
              <p className="font-medium">{(payModal as Payment & { playerName?: string }).playerName}</p>
              <p className="text-xs text-zinc-500">
                {payModal.concept} · {payModal.period ? periodLabel(payModal.period) : ''} · Vence{' '}
                {formatDate(payModal.dueDate)}
              </p>
            </div>
            <Field label="Monto recibido" required hint={`Total: ${formatCurrency(payModal.amount)}`}>
              <Input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </Field>
            <Field label="Método de pago">
              <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="deposito">Depósito</option>
                <option value="otro">Otro</option>
              </Select>
            </Field>
            {Number(payAmount) > 0 && Number(payAmount) < payModal.amount && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                Se registrará como pago parcial.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
