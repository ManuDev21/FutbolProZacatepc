import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  Plus,
  Copy,
  Trash2,
  Pencil,
  Play,
  Flame,
  Clock,
} from 'lucide-react';
import { CaorSubnav } from '@/components/caor/CaorSubnav';
import { useCaorPlans, useCaorPlays, useCategories, useCoaches } from '@/hooks/useData';
import { caorPlansService, createEmptyWeekDays } from '@/services/caor.service';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { formatDate, fullName, todayISO } from '@/lib/utils';
import type { CaorPlan, CaorPlanDay } from '@/types';

export default function CaorPlansPage() {
  const navigate = useNavigate();
  const plans = useCaorPlans();
  const plays = useCaorPlays();
  const categories = useCategories();
  const coaches = useCoaches();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaorPlan | null>(null);

  // Estado del formulario 100% editable
  const [title, setTitle] = useState('Microciclo Competitivo · Semana Tipo');
  const [cycleType, setCycleType] = useState<CaorPlan['cycleType']>('microciclo');
  const [weekLabel, setWeekLabel] = useState('Semana 1');
  const [categoryId, setCategoryId] = useState('');
  const [coachId, setCoachId] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [mainObjective, setMainObjective] = useState(
    'Consolidar salida de balón ante presión alta y mejorar definición en zona 3.',
  );
  const [tacticalFocus, setTacticalFocus] = useState('Amplitud con extremos + presión tras pérdida 5 seg');
  const [physicalFocus, setPhysicalFocus] = useState('Fuerza explosiva + Resistencia intermitente');
  const [status, setStatus] = useState<CaorPlan['status']>('activo');
  const [days, setDays] = useState<CaorPlanDay[]>(() => createEmptyWeekDays());
  const [notes, setNotes] = useState('');

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);
  const coachName = useMemo(() => new Map((coaches ?? []).map((c) => [c.id, fullName(c)])), [coaches]);
  const playById = useMemo(() => new Map((plays ?? []).map((p) => [p.id, p])), [plays]);

  const filtered = useMemo(
    () => (plans ?? []).filter((p) => !selectedCategory || p.categoryId === selectedCategory),
    [plans, selectedCategory],
  );

  const openNew = () => {
    setEditing(null);
    setTitle('Microciclo Competitivo · Semana Tipo');
    setCycleType('microciclo');
    setWeekLabel('Semana 1');
    setCategoryId(categories?.[0]?.id ?? '');
    setCoachId(coaches?.[0]?.id ?? '');
    setStartDate(todayISO());
    setEndDate(todayISO());
    setMainObjective('Consolidar salida de balón ante presión alta y mejorar definición.');
    setTacticalFocus('Progresión combinativa y transiciones');
    setPhysicalFocus('Velocidad de reacción y potencia aeróbica');
    setStatus('activo');
    setDays(createEmptyWeekDays());
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (p: CaorPlan) => {
    setEditing(p);
    setTitle(p.title);
    setCycleType(p.cycleType);
    setWeekLabel(p.weekLabel ?? '');
    setCategoryId(p.categoryId ?? '');
    setCoachId(p.coachId ?? '');
    setStartDate(p.startDate);
    setEndDate(p.endDate);
    setMainObjective(p.mainObjective);
    setTacticalFocus(p.tacticalFocus ?? '');
    setPhysicalFocus(p.physicalFocus ?? '');
    setStatus(p.status);
    setDays(p.days.length > 0 ? p.days.map((d) => ({ ...d, playIds: [...d.playIds] })) : createEmptyWeekDays());
    setNotes(p.notes ?? '');
    setModalOpen(true);
  };

  const updateDay = (idx: number, patch: Partial<CaorPlanDay>) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const togglePlayInDay = (dayIdx: number, playId: string) => {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        const set = new Set(d.playIds);
        if (set.has(playId)) set.delete(playId);
        else set.add(playId);
        return { ...d, playIds: [...set] };
      }),
    );
  };

  const savePlan = async () => {
    if (!title.trim()) {
      toast.warning('Ingresa un título para la planificación');
      return;
    }
    const payload: Omit<CaorPlan, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      cycleType,
      weekLabel: weekLabel.trim() || undefined,
      categoryId: categoryId || undefined,
      coachId: coachId || undefined,
      startDate,
      endDate,
      mainObjective: mainObjective.trim(),
      tacticalFocus: tacticalFocus.trim() || undefined,
      physicalFocus: physicalFocus.trim() || undefined,
      status,
      days,
      notes: notes.trim() || undefined,
    };

    if (editing) {
      await caorPlansService.update(editing.id, payload);
      toast.success('Planificación actualizada');
    } else {
      await caorPlansService.create(payload);
      toast.success('Planificación CAOR creada');
    }
    setModalOpen(false);
  };

  const removePlan = async (p: CaorPlan) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar planificación',
        message: `¿Eliminar "${p.title}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await caorPlansService.remove(p.id);
    toast.success('Planificación eliminada');
  };

  return (
    <div className="space-y-6">
      <CaorSubnav />

      <PageHeader
        title="Planificaciones"
        subtitle="Microciclos semanales, mesociclos y macrociclos con objetivos, minutos y esfuerzo percibido"
        actions={
          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-0 flex-1 sm:w-44 sm:flex-none"
            >
              <option value="">Todas las categorías</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Nueva planificación
            </Button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarRange className="h-10 w-10" />}
            title="Sin planificaciones registradas"
            message="Crea tu primer microciclo semanal con objetivos tácticos, físicos, carga RPE y jugadas por día."
            action={
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4" /> Crear planificación semanal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {filtered.map((plan) => {
            const totalMin = plan.days.reduce((a, d) => a + (d.durationMin || 0), 0);
            const activeDays = plan.days.filter((d) => d.durationMin > 0);
            const avgRpe =
              activeDays.length > 0
                ? (activeDays.reduce((a, d) => a + d.rpe, 0) / activeDays.length).toFixed(1)
                : '0';

            return (
              <Card key={plan.id}>
                <CardHeader
                  title={plan.title}
                  subtitle={`${plan.weekLabel ? `${plan.weekLabel} · ` : ''}${formatDate(plan.startDate)} al ${formatDate(plan.endDate)}${plan.categoryId ? ` · ${catName.get(plan.categoryId) ?? ''}` : ''}${plan.coachId ? ` · DT: ${coachName.get(plan.coachId) ?? ''}` : ''}`}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{plan.cycleType.toUpperCase()}</Badge>
                      <Badge
                        tone={
                          plan.status === 'activo'
                            ? 'green'
                            : plan.status === 'completado'
                              ? 'gold'
                              : 'gray'
                        }
                      >
                        {plan.status}
                      </Badge>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold dark:bg-zinc-800">
                        <Clock className="h-3.5 w-3.5 text-brand-600" /> {totalMin} min
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold dark:bg-zinc-800">
                        <Flame className="h-3.5 w-3.5 text-brand-600" /> RPE {avgRpe}/10
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await caorPlansService.duplicate(plan.id);
                          toast.success('Planificación duplicada');
                        }}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removePlan(plan)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  }
                />
                <CardBody className="space-y-5 p-5">
                  <div className="grid gap-4 rounded-xl bg-zinc-50 p-4 text-xs sm:grid-cols-3 dark:bg-zinc-800/50">
                    <div>
                      <span className="font-bold text-zinc-500 uppercase">Objetivo principal</span>
                      <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{plan.mainObjective}</p>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-500 uppercase">Foco táctico</span>
                      <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {plan.tacticalFocus || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-500 uppercase">Foco físico</span>
                      <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {plan.physicalFocus || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Cuadrícula de 7 días con más aire */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                    {plan.days.map((d) => (
                      <div
                        key={d.day}
                        className="flex flex-col justify-between rounded-xl border border-zinc-200 p-3.5 text-xs dark:border-zinc-800"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-brand-700 dark:text-brand-400">{d.day}</span>
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {d.durationMin}m · RPE {d.rpe}
                            </span>
                          </div>
                          <p className="mt-2 leading-relaxed font-medium text-zinc-800 dark:text-zinc-100">{d.focus}</p>
                          {d.playIds.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {d.playIds.map((pid) => {
                                const pl = playById.get(pid);
                                if (!pl) return null;
                                return (
                                  <button
                                    key={pid}
                                    type="button"
                                    onClick={() => navigate(`/app/caor/estudio?id=${pid}`)}
                                    className="flex w-full items-center gap-1.5 truncate rounded-lg bg-brand-50 px-2 py-1 text-left text-[11px] font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300"
                                  >
                                    <Play className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{pl.title}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal crear / editar planificación */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Planificación CAOR' : 'Nueva Planificación CAOR'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePlan}>Guardar planificación</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Título de la planificación" required className="sm:col-span-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Tipo de ciclo">
              <Select
                value={cycleType}
                onChange={(e) => setCycleType(e.target.value as CaorPlan['cycleType'])}
              >
                <option value="microciclo">Microciclo (Semanal)</option>
                <option value="mesociclo">Mesociclo (Mensual)</option>
                <option value="macrociclo">Macrociclo (Temporada)</option>
              </Select>
            </Field>
            <Field label="Etiqueta / Semana">
              <Input
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="Ej. Semana 12 · Pre-competitiva"
              />
            </Field>
            <Field label="Categoría">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">General / Todas</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Entrenador responsable">
              <Select value={coachId} onChange={(e) => setCoachId(e.target.value)}>
                <option value="">Sin asignar</option>
                {(coaches ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {fullName(c)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha inicio">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Fecha fin">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
            <Field label="Estado">
              <Select value={status} onChange={(e) => setStatus(e.target.value as CaorPlan['status'])}>
                <option value="borrador">Borrador</option>
                <option value="activo">Activo</option>
                <option value="completado">Completado</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Objetivo principal">
              <Input value={mainObjective} onChange={(e) => setMainObjective(e.target.value)} />
            </Field>
            <Field label="Foco táctico">
              <Input value={tacticalFocus} onChange={(e) => setTacticalFocus(e.target.value)} />
            </Field>
            <Field label="Foco físico / condicional">
              <Input value={physicalFocus} onChange={(e) => setPhysicalFocus(e.target.value)} />
            </Field>
          </div>

          {/* Editor de los 7 días del microciclo */}
          <div>
            <p className="mb-2 text-xs font-bold tracking-wider text-zinc-500 uppercase">
              Distribución diaria del Microciclo (100% editable)
            </p>
            <div className="space-y-2">
              {days.map((d, idx) => (
                <div
                  key={d.day}
                  className="grid gap-2 rounded-xl border border-zinc-200 p-3 sm:grid-cols-[95px_1fr_90px_90px] sm:items-center dark:border-zinc-700"
                >
                  <span className="text-sm font-extrabold text-brand-700 dark:text-brand-400">{d.day}</span>
                  <Input
                    value={d.focus}
                    onChange={(e) => updateDay(idx, { focus: e.target.value })}
                    placeholder="Contenido principal del día..."
                  />
                  <Field label="Minutos">
                    <Input
                      type="number"
                      min={0}
                      max={240}
                      value={d.durationMin}
                      onChange={(e) => updateDay(idx, { durationMin: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </Field>
                  <Field label="RPE (1-10)">
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={d.rpe}
                      onChange={(e) =>
                        updateDay(idx, { rpe: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })
                      }
                    />
                  </Field>
                  {plays && plays.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 sm:col-span-4">
                      <span className="mr-1 text-[11px] text-zinc-400">Vincular jugadas CAOR:</span>
                      {plays.slice(0, 8).map((pl) => {
                        const active = d.playIds.includes(pl.id);
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => togglePlayInDay(idx, pl.id)}
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              active
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {pl.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field label="Observaciones generales">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
