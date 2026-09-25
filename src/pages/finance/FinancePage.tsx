import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2, TrendingDown, TrendingUp, Wallet, Scale, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { useFinance } from '@/hooks/useData';
import { financeService } from '@/services/finance.service';
import { paymentsService } from '@/services/payments.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Pagination, SearchInput, TableSkeleton, Tabs } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { StatCard } from '@/components/dashboard/StatCard';
import { financeSchema, type FinanceForm } from '@/lib/validators';
import { formatCurrency, formatDate, matchesSearch, todayISO } from '@/lib/utils';
import type { FinanceMovement } from '@/types';
import { useLiveQuery } from 'dexie-react-hooks';

const PAGE_SIZE = 12;
const INCOME_CATS = ['Mensualidades', 'Inscripciones', 'Uniformes', 'Torneos', 'Patrocinios', 'Otros'];
const EXPENSE_CATS = ['Instalaciones', 'Material deportivo', 'Torneos', 'Transporte', 'Personal', 'Otros'];
const CHART_COLORS = ['#177541', '#f5a801', '#2563eb', '#7c3aed', '#dc2626', '#0ea5e9', '#84cc16'];

export default function FinancePage() {
  const movements = useFinance();
  const summary = useLiveQuery(() => financeService.summary(), []);
  const monthly = useLiveQuery(() => financeService.monthlySeries(6), []);
  const incomeByCat = useLiveQuery(() => financeService.byCategoryLabel('ingreso'), []);
  const expenseByCat = useLiveQuery(() => financeService.byCategoryLabel('gasto'), []);
  const pending = useLiveQuery(() => paymentsService.summary(), []);

  const [tab, setTab] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{
    open: boolean;
    movement?: FinanceMovement | null;
    type?: 'ingreso' | 'gasto';
  }>({ open: false });
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FinanceForm>({ resolver: zodResolver(financeSchema) });

  const formType = watch('type');

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.movement
          ? {
              type: modal.movement.type,
              concept: modal.movement.concept,
              categoryLabel: modal.movement.categoryLabel ?? '',
              amount: modal.movement.amount,
              date: modal.movement.date,
              method: modal.movement.method,
              description: modal.movement.description ?? '',
            }
          : { type: modal.type ?? 'ingreso', date: todayISO() },
      );
    }
  }, [modal.open, modal.movement, modal.type, reset]);

  const filtered = useMemo(() => {
    let list = movements ?? [];
    if (tab !== 'todos') list = list.filter((m) => m.type === tab);
    if (search.trim())
      list = list.filter((m) => matchesSearch([m.concept, m.categoryLabel, m.description], search));
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, tab, search]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      if (modal.movement) {
        await financeService.update(modal.movement.id, data);
        toast.success('Movimiento actualizado');
      } else {
        await financeService.create(data);
        toast.success(data.type === 'ingreso' ? 'Ingreso registrado' : 'Gasto registrado');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (m: FinanceMovement) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar movimiento',
        message: `¿Eliminar "${m.concept}" por ${formatCurrency(m.amount)}?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await financeService.remove(m.id);
    toast.success('Movimiento eliminado');
  };

  return (
    <div>
      <PageHeader
        title="Finanzas"
        subtitle="Ingresos, gastos y balance"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setModal({ open: true, movement: null, type: 'gasto' })}
            >
              <TrendingDown className="h-4 w-4 text-red-500" /> Gasto
            </Button>
            <Button onClick={() => setModal({ open: true, movement: null, type: 'ingreso' })}>
              <TrendingUp className="h-4 w-4" /> Ingreso
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={TrendingUp}
          label="Ingresos hoy"
          value={formatCurrency(summary?.ingresosHoy ?? 0)}
          tone="brand"
        />
        <StatCard
          icon={TrendingUp}
          label="Ingresos del mes"
          value={formatCurrency(summary?.ingresosMes ?? 0)}
          tone="brand"
        />
        <StatCard
          icon={TrendingDown}
          label="Gastos del mes"
          value={formatCurrency(summary?.gastosMes ?? 0)}
          tone="red"
        />
        <StatCard
          icon={Scale}
          label="Balance"
          value={formatCurrency(summary?.balance ?? 0)}
          tone={(summary?.balance ?? 0) >= 0 ? 'brand' : 'red'}
        />
        <StatCard
          icon={Clock}
          label="Pagos pendientes"
          value={pending?.pendiente ?? 0}
          sub={formatCurrency(pending?.porCobrar ?? 0)}
          tone="gold"
        />
        <StatCard icon={Wallet} label="Pagos vencidos" value={pending?.vencido ?? 0} tone="red" />
      </div>

      {/* Gráficas */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Evolución mensual" />
          <CardBody className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly ?? []}>
                <defs>
                  <linearGradient id="fi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#177541" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#177541" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos"
                  stroke="#177541"
                  fill="url(#fi)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="gastos"
                  name="Gastos"
                  stroke="#dc2626"
                  fill="url(#fg)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Por categoría" />
          <CardBody className="h-60">
            <ResponsiveContainer width="100%" height="50%">
              <PieChart>
                <Pie data={incomeByCat ?? []} dataKey="value" nameKey="name" outerRadius={45}>
                  {(incomeByCat ?? []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height="50%">
              <PieChart>
                <Pie data={expenseByCat ?? []} dataKey="value" nameKey="name" outerRadius={45}>
                  {(expenseByCat ?? []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <p className="mt-1 text-center text-[11px] text-zinc-400">Ingresos (arriba) · Gastos (abajo)</p>
          </CardBody>
        </Card>
      </div>

      {/* Movimientos */}
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
          <Tabs
            tabs={[
              { key: 'todos', label: 'Todos' },
              { key: 'ingreso', label: 'Ingresos' },
              { key: 'gasto', label: 'Gastos' },
            ]}
            active={tab}
            onChange={(k) => {
              setTab(k as typeof tab);
              setPage(1);
            }}
          />
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            className="min-w-52 flex-1"
            placeholder="Buscar movimiento..."
          />
        </div>
        {!movements ? (
          <TableSkeleton />
        ) : pageItems.length === 0 ? (
          <EmptyState title="Sin movimientos" message="Registra ingresos y gastos para llevar el control." />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th>Concepto</Th>
                  <Th>Categoría</Th>
                  <Th>Método</Th>
                  <Th className="text-right">Monto</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </THead>
              <TBody>
                {pageItems.map((m) => (
                  <Tr key={m.id}>
                    <Td className="whitespace-nowrap text-zinc-500">{formatDate(m.date)}</Td>
                    <Td>
                      <Badge tone={m.type === 'ingreso' ? 'green' : 'red'}>
                        {m.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </Td>
                    <Td className="font-medium">{m.concept}</Td>
                    <Td className="text-zinc-500">{m.categoryLabel ?? '—'}</Td>
                    <Td className="text-zinc-500 capitalize">{m.method ?? '—'}</Td>
                    <Td
                      className={`text-right font-semibold ${m.type === 'ingreso' ? 'text-brand-600' : 'text-red-600'}`}
                    >
                      {m.type === 'ingreso' ? '+' : '-'}
                      {formatCurrency(m.amount)}
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModal({ open: true, movement: m })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(m)}>
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

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={
          modal.movement
            ? 'Editar movimiento'
            : modal.type === 'gasto'
              ? 'Registrar gasto'
              : 'Registrar ingreso'
        }
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
          <Field label="Tipo" required>
            <div className="flex gap-2">
              {(['ingreso', 'gasto'] as const).map((t) => (
                <label
                  key={t}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    formType === t
                      ? t === 'ingreso'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20'
                        : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20'
                      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700'
                  }`}
                >
                  <input type="radio" value={t} {...register('type')} className="sr-only" />
                  {t === 'ingreso' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {t === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </label>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Concepto" required error={errors.concept?.message}>
              <Input {...register('concept')} placeholder="Mensualidad / Renta de cancha" />
            </Field>
            <Field label="Categoría" error={errors.categoryLabel?.message}>
              <Select {...register('categoryLabel')}>
                <option value="">Sin categoría</option>
                {(formType === 'ingreso' ? INCOME_CATS : EXPENSE_CATS).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Monto" required error={errors.amount?.message}>
              <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
            </Field>
            <Field label="Fecha" required error={errors.date?.message}>
              <Input type="date" {...register('date')} />
            </Field>
            <Field label="Método" error={errors.method?.message}>
              <Select {...register('method')}>
                <option value="">—</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="deposito">Depósito</option>
                <option value="otro">Otro</option>
              </Select>
            </Field>
          </div>
          <Field label="Descripción" error={errors.description?.message}>
            <Textarea {...register('description')} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
