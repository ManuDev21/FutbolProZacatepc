import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowDown, ArrowLeft, ArrowUp, FileDown, Plus, Printer, Save, Search, X } from 'lucide-react';
import { db } from '@/db/database';
import { useCategories, useCoaches, useExercises } from '@/hooks/useData';
import { trainingsService } from '@/services/trainings.service';
import { toast } from '@/stores/toast';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/misc';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, matchesSearch, cn } from '@/lib/utils';
import type { Exercise, TrainingStep } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_GREEN, imageToDataUrl } from '@/lib/pdf';
import { settingsService } from '@/services/settings.service';

const PHASE_LABELS = ['Calentamiento', 'Parte principal', 'Juego/Finalización', 'Vuelta a la calma'];

export default function TrainingBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const training = useLiveQuery(() => (id ? db.trainings.get(id) : undefined), [id]);
  const exercises = useExercises();
  const categories = useCategories();
  const coaches = useCoaches();

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 200);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [steps, setSteps] = useState<TrainingStep[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Sincroniza los pasos cuando llega el documento
  if (training && loadedId !== training.id) {
    setSteps(training.steps);
    setLoadedId(training.id);
  }

  const exerciseById = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e])), [exercises]);

  const library = useMemo(() => {
    let list = exercises ?? [];
    if (debounced.trim()) list = list.filter((e) => matchesSearch([e.name, e.objective, e.area], debounced));
    return list.slice(0, 30);
  }, [exercises, debounced]);

  const total = steps.reduce((acc, s) => acc + (s.durationMin || 0), 0);
  const category = categories?.find((c) => c.id === training?.categoryId);
  const coach = coaches?.find((c) => c.id === training?.coachId);

  if (training === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (!training) {
    return (
      <EmptyState
        title="Sesión no encontrada"
        action={<Button onClick={() => navigate('/app/entrenamientos')}>Volver</Button>}
      />
    );
  }

  const addExercise = (ex: Exercise) => {
    setSteps((s) => [...s, { exerciseId: ex.id, durationMin: ex.durationMin ?? 15 }]);
    setPickerOpen(false);
    setSearch('');
  };

  const move = (i: number, dir: -1 | 1) => {
    setSteps((s) => {
      const copy = [...s];
      const j = i + dir;
      if (j < 0 || j >= copy.length) return s;
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const setDuration = (i: number, v: number) => {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, durationMin: v } : st)));
  };

  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      await trainingsService.update(training.id, { steps });
      toast.success('Sesión guardada', `Duración total: ${total} min`);
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    await save();
    const copy = await trainingsService.duplicate(training.id);
    if (copy) {
      toast.success('Sesión duplicada', copy.name);
      navigate(`/app/entrenamientos/${copy.id}`);
    }
  };

  const exportPdf = async () => {
    const school = await settingsService.getSchool();
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFillColor(...PDF_GREEN);
    doc.rect(0, 0, 210, 28, 'F');
    try {
      const logo = await imageToDataUrl('/logo.svg', 128);
      doc.addImage(logo, 'PNG', 10, 4, 20, 20);
    } catch {
      /* sin logo */
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(school?.name ?? 'FútbolPro Zacatepec', 36, 12);
    doc.setFontSize(10);
    doc.text(`Sesión: ${training.name}`, 36, 20);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(
      `Fecha: ${formatDate(training.date)}   Categoría: ${category?.name ?? '—'}   Entrenador: ${coach ? `${coach.firstName} ${coach.lastName}` : '—'}   Duración: ${total} min`,
      14,
      38,
    );
    if (training.objective) doc.text(`Objetivo: ${training.objective}`, 14, 44);
    autoTable(doc, {
      startY: 48,
      head: [['#', 'Bloque', 'Ejercicio', 'Duración', 'Objetivo']],
      body: steps.map((s, i) => {
        const ex = exerciseById.get(s.exerciseId);
        return [
          i + 1,
          i === 0 ? PHASE_LABELS[0] : i === steps.length - 1 ? PHASE_LABELS[3] : PHASE_LABELS[1],
          ex?.name ?? '(ejercicio eliminado)',
          `${s.durationMin} min`,
          ex?.objective ?? '',
        ];
      }),
      foot: [['', '', 'Duración total', `${total} min`, '']],
      theme: 'striped',
      headStyles: { fillColor: PDF_GREEN },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    doc.save(`entrenamiento-${training.name}.pdf`.replace(/\s+/g, '-').toLowerCase());
    toast.success('PDF generado');
  };

  const print = async () => {
    await save();
    window.print();
  };

  return (
    <div>
      <PageHeader
        title={training.name}
        subtitle={`${formatDate(training.date)} · ${category?.name ?? 'Sin categoría'} · Duración total: ${total} min`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/entrenamientos')}>
              <ArrowLeft className="h-4 w-4" /> Sesiones
            </Button>
            <Button variant="secondary" size="sm" onClick={duplicate}>
              Duplicar
            </Button>
            <Button variant="secondary" size="sm" onClick={exportPdf}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={print}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button size="sm" onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> Guardar
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Constructor */}
        <Card>
          <CardHeader
            title="Bloques de la sesión"
            subtitle={`${steps.length} ejercicios · ${total} minutos en total`}
            action={
              <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4" /> Agregar ejercicio
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {steps.length === 0 && (
              <EmptyState
                title="Sesión vacía"
                message="Agrega ejercicios de la biblioteca para armar la sesión."
              />
            )}
            {steps.map((s, i) => {
              const ex = exerciseById.get(s.exerciseId);
              const phase =
                i === 0 && steps.length > 1
                  ? PHASE_LABELS[0]
                  : i === steps.length - 1 && steps.length > 1
                    ? PHASE_LABELS[3]
                    : PHASE_LABELS[1];
              return (
                <div
                  key={`${s.exerciseId}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ex?.name ?? '(ejercicio eliminado)'}</p>
                    <p className="text-[11px] text-zinc-400">
                      <Badge tone="outline" className="mr-1">
                        {phase}
                      </Badge>
                      {ex?.objective}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={240}
                      value={s.durationMin}
                      onChange={(e) => setDuration(i, Math.max(1, Number(e.target.value)))}
                      className="w-16 py-1 text-center text-xs"
                    />
                    <span className="text-xs text-zinc-400">min</span>
                  </div>
                  <div className="flex flex-col">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === steps.length - 1}
                      className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeStep(i)}
                    className="rounded p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Panel biblioteca */}
        <Card className={cn('h-fit lg:sticky lg:top-4', !pickerOpen && 'hidden lg:block')}>
          <CardHeader
            title="Biblioteca"
            subtitle={`${exercises?.length ?? 0} ejercicios`}
            action={
              pickerOpen && (
                <button
                  onClick={() => setPickerOpen(false)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              )
            }
          />
          <CardBody>
            <Field label="Buscar ejercicio">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Rondo, posesión, físico..."
                />
              </div>
            </Field>
            <ul className="mt-3 max-h-[55vh] space-y-1.5 overflow-y-auto">
              {library.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => addExercise(e)}
                    className="flex w-full items-center gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-left text-sm transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-zinc-800 dark:hover:bg-brand-900/10"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.name}</span>
                      <span className="text-[11px] text-zinc-400">
                        {e.minAge}-{e.maxAge} años · Nv {e.difficulty}
                        {e.durationMin ? ` · ${e.durationMin} min` : ''}
                      </span>
                    </span>
                    <Plus className="h-4 w-4 shrink-0 text-brand-600" />
                  </button>
                </li>
              ))}
              {library.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-400">Sin resultados</p>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
