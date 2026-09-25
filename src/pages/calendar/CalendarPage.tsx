import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCategories, useEvents } from '@/hooks/useData';
import { eventsService } from '@/services/events.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { eventSchema, type EventForm } from '@/lib/validators';
import { cn, toISODate, todayISO } from '@/lib/utils';
import type { EventItem, EventType } from '@/types';

const TYPE_META: Record<
  EventType,
  { label: string; dot: string; tone: 'green' | 'blue' | 'gold' | 'red' | 'gray' }
> = {
  entrenamiento: { label: 'Entrenamiento', dot: 'bg-brand-500', tone: 'green' },
  partido: { label: 'Partido', dot: 'bg-blue-500', tone: 'blue' },
  torneo: { label: 'Torneo', dot: 'bg-gold-500', tone: 'gold' },
  reunion: { label: 'Reunión', dot: 'bg-purple-500', tone: 'blue' },
  otro: { label: 'Otro', dot: 'bg-zinc-500', tone: 'gray' },
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const events = useEvents();
  const categories = useCategories();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [modal, setModal] = useState<{ open: boolean; event?: EventItem | null; date?: string }>({
    open: false,
  });
  const [saving, setSaving] = useState(false);

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventForm>({ resolver: zodResolver(eventSchema), defaultValues: { type: 'entrenamiento' } });

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.event
          ? {
              title: modal.event.title,
              type: modal.event.type,
              date: modal.event.date,
              endDate: modal.event.endDate ?? '',
              time: modal.event.time ?? '',
              location: modal.event.location ?? '',
              categoryId: modal.event.categoryId ?? '',
              description: modal.event.description ?? '',
            }
          : { type: 'entrenamiento', date: modal.date ?? todayISO() },
      );
    }
  }, [modal.open, modal.event, modal.date, reset]);

  // Grid del mes (lunes como inicio de semana)
  const grid = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // lunes = 0
    const days: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) days.push(toISODate(new Date(y, m, d)));
    return days;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events ?? []) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const monthEvents = (events ?? [])
    .filter((e) => e.date.startsWith(monthKey(cursor)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const move = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        endDate: data.endDate || undefined,
        categoryId: data.categoryId || undefined,
      };
      if (modal.event) {
        await eventsService.update(modal.event.id, payload);
        toast.success('Evento actualizado');
      } else {
        await eventsService.create(payload);
        toast.success('Evento creado');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar el evento');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (e: EventItem) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar evento',
        message: `¿Eliminar "${e.title}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await eventsService.remove(e.id);
    toast.success('Evento eliminado');
  };

  const monthLabel = cursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const today = todayISO();

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Entrenamientos, partidos, torneos y reuniones"
        actions={
          <Button onClick={() => setModal({ open: true, event: null })}>
            <Plus className="h-4 w-4" /> Nuevo evento
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* Grid mensual */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <button
              onClick={() => move(-1)}
              className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-sm font-bold capitalize">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
              >
                Hoy
              </button>
              <button
                onClick={() => move(1)}
                className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-bold tracking-wide text-zinc-400 uppercase">
            {WEEKDAYS.map((d) => (
              <div key={d} className="border-b border-zinc-100 py-2 dark:border-zinc-800">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((day, i) => {
              const dayEvents = day ? (byDay.get(day) ?? []) : [];
              return (
                <div
                  key={i}
                  onClick={() => day && setModal({ open: true, event: null, date: day })}
                  className={cn(
                    'min-h-16 cursor-pointer border-b border-r border-zinc-100 p-1.5 transition-colors hover:bg-brand-50/50 sm:min-h-24 dark:border-zinc-800 dark:hover:bg-brand-900/10',
                    !day &&
                      'cursor-default bg-zinc-50/50 hover:bg-zinc-50/50 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/50',
                  )}
                >
                  {day && (
                    <>
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                          day === today && 'bg-brand-600 font-bold text-white',
                        )}
                      >
                        {Number(day.slice(-2))}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <button
                            key={e.id}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setModal({ open: true, event: e });
                            }}
                            className="block w-full truncate rounded bg-brand-100 px-1 py-0.5 text-left text-[10px] font-medium text-brand-800 hover:bg-brand-200 dark:bg-brand-900/40 dark:text-brand-200"
                          >
                            {e.time ? `${e.time} ` : ''}
                            {e.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[9px] text-zinc-400">+{dayEvents.length - 3} más</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Lista del mes */}
        <Card>
          <CardHeader title={`Eventos de ${monthLabel}`} />
          <CardBody className="max-h-[60vh] space-y-2 overflow-y-auto">
            {monthEvents.length === 0 ? (
              <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="Mes sin eventos" />
            ) : (
              monthEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', TYPE_META[e.type].dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-zinc-500">
                      {e.date} {e.time && `· ${e.time}`} {e.location && `· ${e.location}`}
                    </p>
                    <div className="mt-1 flex gap-1">
                      <Badge tone={TYPE_META[e.type].tone}>{TYPE_META[e.type].label}</Badge>
                      {e.categoryId && <Badge tone="outline">{catName.get(e.categoryId)}</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => setModal({ open: true, event: e })}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(e)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.event ? 'Editar evento' : 'Nuevo evento'}
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
          <Field label="Título" required error={errors.title?.message}>
            <Input {...register('title')} placeholder="Partido vs. Deportivo" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" error={errors.type?.message}>
              <Select {...register('type')}>
                {Object.entries(TYPE_META).map(([v, m]) => (
                  <option key={v} value={v}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoría" error={errors.categoryId?.message}>
              <Select {...register('categoryId')}>
                <option value="">General</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" required error={errors.date?.message}>
              <Input type="date" {...register('date')} />
            </Field>
            <Field label="Fecha fin (opcional)" error={errors.endDate?.message}>
              <Input type="date" {...register('endDate')} />
            </Field>
            <Field label="Hora" error={errors.time?.message}>
              <Input type="time" {...register('time')} />
            </Field>
            <Field label="Lugar" error={errors.location?.message}>
              <Input {...register('location')} placeholder="Cancha principal" />
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
