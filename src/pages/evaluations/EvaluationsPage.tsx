import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCategories, useEvaluations, usePlayers } from '@/hooks/useData';
import { evaluationsService } from '@/services/evaluations.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Avatar, EmptyState, PageHeader, Pagination, TableSkeleton } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { evaluationSchema, type EvaluationForm } from '@/lib/validators';
import { formatDate, fullName, todayISO } from '@/lib/utils';
import type { Evaluation } from '@/types';

const PAGE_SIZE = 12;
const SCORE_KEYS = [
  ['tecnica', 'Técnica'],
  ['velocidad', 'Velocidad'],
  ['tactica', 'Táctica'],
  ['fisico', 'Condición física'],
  ['actitud', 'Actitud'],
] as const;

const PERIOD_LABEL: Record<string, string> = {
  inicial: 'Evaluación inicial',
  mensual: 'Evaluación mensual',
  trimestral: 'Evaluación trimestral',
  semestral: 'Evaluación semestral',
  final: 'Evaluación final',
  personalizada: 'Personalizada',
};

export default function EvaluationsPage() {
  const evaluations = useEvaluations();
  const players = usePlayers();
  const categories = useCategories();
  const navigate = useNavigate();

  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; evaluation?: Evaluation | null }>({ open: false });
  const [saving, setSaving] = useState(false);

  const playerById = useMemo(() => new Map((players ?? []).map((p) => [p.id, p])), [players]);
  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EvaluationForm>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      period: 'mensual',
      date: todayISO(),
      tecnica: 60,
      velocidad: 60,
      tactica: 60,
      fisico: 60,
      actitud: 70,
    },
  });

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.evaluation
          ? {
              playerId: modal.evaluation.playerId,
              date: modal.evaluation.date,
              period: modal.evaluation.period,
              label: modal.evaluation.label ?? '',
              tecnica: modal.evaluation.scores.tecnica,
              velocidad: modal.evaluation.scores.velocidad,
              tactica: modal.evaluation.scores.tactica,
              fisico: modal.evaluation.scores.fisico,
              actitud: modal.evaluation.scores.actitud,
              notes: modal.evaluation.notes ?? '',
            }
          : {
              period: 'mensual',
              date: todayISO(),
              tecnica: 60,
              velocidad: 60,
              tactica: 60,
              fisico: 60,
              actitud: 70,
            },
      );
    }
  }, [modal.open, modal.evaluation, reset]);

  const filtered = useMemo(() => {
    let list = evaluations ?? [];
    if (filterPlayer) list = list.filter((e) => e.playerId === filterPlayer);
    if (filterCat) {
      const ids = new Set((players ?? []).filter((p) => p.categoryId === filterCat).map((p) => p.id));
      list = list.filter((e) => ids.has(e.playerId));
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [evaluations, filterPlayer, filterCat, players]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      const payload = {
        playerId: data.playerId,
        date: data.date,
        period: data.period,
        label: data.label || PERIOD_LABEL[data.period],
        scores: {
          tecnica: data.tecnica,
          velocidad: data.velocidad,
          tactica: data.tactica,
          fisico: data.fisico,
          actitud: data.actitud,
        },
        notes: data.notes,
      };
      if (modal.evaluation) {
        await evaluationsService.update(modal.evaluation.id, payload);
        toast.success('Evaluación actualizada');
      } else {
        await evaluationsService.create(payload);
        toast.success('Evaluación registrada');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar la evaluación');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (e: Evaluation) => {
    const p = playerById.get(e.playerId);
    if (
      !(await confirmDialog({
        title: 'Eliminar evaluación',
        message: `¿Eliminar la evaluación "${e.label ?? e.period}" de ${p ? fullName(p) : 'jugador'}?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await evaluationsService.remove(e.id);
    toast.success('Evaluación eliminada');
  };

  const avg = (e: Evaluation) =>
    Math.round(
      (e.scores.tecnica + e.scores.velocidad + e.scores.tactica + e.scores.fisico + e.scores.actitud) / 5,
    );

  return (
    <div>
      <PageHeader
        title="Evaluaciones"
        subtitle="Rendimiento por jugador — escala 0 a 100"
        actions={
          <Button onClick={() => setModal({ open: true, evaluation: null })}>
            <Plus className="h-4 w-4" /> Nueva evaluación
          </Button>
        }
      />
      <Card>
        <div className="flex flex-col gap-2 border-b border-zinc-100 p-3 sm:flex-row sm:flex-wrap dark:border-zinc-800">
          <Select
            value={filterPlayer}
            onChange={(e) => {
              setFilterPlayer(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-56"
          >
            <option value="">Todos los jugadores</option>
            {players?.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)}
              </option>
            ))}
          </Select>
          <Select
            value={filterCat}
            onChange={(e) => {
              setFilterCat(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
          >
            <option value="">Todas las categorías</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {!evaluations ? (
          <TableSkeleton />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-10 w-10" />}
            title="Sin evaluaciones"
            action={
              <Button size="sm" onClick={() => setModal({ open: true })}>
                <Plus className="h-4 w-4" /> Evaluar jugador
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Jugador</Th>
                  <Th>Periodo</Th>
                  <Th>Fecha</Th>
                  <Th>Téc.</Th>
                  <Th>Vel.</Th>
                  <Th>Tác.</Th>
                  <Th>Fís.</Th>
                  <Th>Act.</Th>
                  <Th>Promedio</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </THead>
              <TBody>
                {pageItems.map((e) => {
                  const p = playerById.get(e.playerId);
                  const a = avg(e);
                  return (
                    <Tr
                      key={e.id}
                      className="cursor-pointer"
                      onClick={() => p && navigate(`/app/jugadores/${p.id}`)}
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar src={p?.photo} name={p ? fullName(p) : '?'} size="sm" />
                          <div>
                            <p className="font-medium">{p ? fullName(p) : '—'}</p>
                            <p className="text-[11px] text-zinc-400">
                              {catName.get(p?.categoryId ?? '') ?? ''}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone="blue">{e.label ?? PERIOD_LABEL[e.period]}</Badge>
                      </Td>
                      <Td className="text-zinc-500">{formatDate(e.date)}</Td>
                      <Td>{e.scores.tecnica}</Td>
                      <Td>{e.scores.velocidad}</Td>
                      <Td>{e.scores.tactica}</Td>
                      <Td>{e.scores.fisico}</Td>
                      <Td>{e.scores.actitud}</Td>
                      <Td>
                        <Badge tone={a >= 75 ? 'green' : a >= 55 ? 'gold' : 'red'}>{a}</Badge>
                      </Td>
                      <Td className="text-right" onClick={(ev) => ev.stopPropagation()}>
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModal({ open: true, evaluation: e })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(e)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.evaluation ? 'Editar evaluación' : 'Nueva evaluación'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              Guardar evaluación
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Jugador" required error={errors.playerId?.message} className="sm:col-span-2">
              <Select {...register('playerId')}>
                <option value="">Seleccionar...</option>
                {players?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fullName(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" required error={errors.date?.message}>
              <Input type="date" {...register('date')} />
            </Field>
            <Field label="Tipo de evaluación" error={errors.period?.message}>
              <Select {...register('period')}>
                {Object.entries(PERIOD_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Etiqueta" error={errors.label?.message} className="sm:col-span-2">
              <Input {...register('label')} placeholder="Ej. Septiembre 2026" />
            </Field>
          </div>

          <div className="space-y-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
            {SCORE_KEYS.map(([key, label]) => {
              const value = watch(key);
              return (
                <div key={key} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{label}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => setValue(key, Number(e.target.value), { shouldValidate: true })}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-brand-600 dark:bg-zinc-700"
                  />
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-center text-xs font-bold ${
                      value >= 75
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                        : value >= 55
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>

          <Field label="Observaciones" error={errors.notes?.message}>
            <Textarea {...register('notes')} placeholder="Fortalezas, áreas de oportunidad..." />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
