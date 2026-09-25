import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Dumbbell, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useExercises } from '@/hooks/useData';
import { exercisesService } from '@/services/exercises.service';
import { db } from '@/db/database';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Pagination, SearchInput, Skeleton } from '@/components/ui/misc';
import { ExerciseFormModal } from '@/components/exercises/ExerciseFormModal';
import { matchesSearch, cn } from '@/lib/utils';
import type { Exercise } from '@/types';
import type { ExerciseForm } from '@/lib/validators';

const PAGE_SIZE = 24;

const AREAS = ['tecnica', 'tactica', 'fisico', 'porteros'];
const TAGS = ['tecnica', 'tactica', 'fisico', 'finalizacion', 'posesion', 'velocidad', 'coordinacion'];
const AREA_LABEL: Record<string, string> = {
  tecnica: 'Técnica',
  tactica: 'Táctica',
  fisico: 'Físico',
  porteros: 'Porteros',
};
const TAG_LABEL: Record<string, string> = {
  tecnica: 'Técnica',
  tactica: 'Táctica',
  fisico: 'Físico',
  finalizacion: 'Finalización',
  posesion: 'Posesión',
  velocidad: 'Velocidad',
  coordinacion: 'Coordinación',
};

const DIFF_COLORS = ['', 'bg-lime-500', 'bg-brand-500', 'bg-gold-500', 'bg-orange-500', 'bg-red-500'];

export default function ExercisesPage() {
  const total = useLiveQuery(() => db.exercises.count(), []);
  const all = useExercises(); // catálogo completo para filtros por facetas

  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [tag, setTag] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [age, setAge] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; exercise?: Exercise | null }>({ open: false });

  const filtered = useMemo(() => {
    let list = all ?? [];
    if (search.trim()) list = list.filter((e) => matchesSearch([e.name, e.description, e.objective], search));
    if (area) list = list.filter((e) => e.area === area);
    if (tag) list = list.filter((e) => e.tags.includes(tag));
    if (difficulty) list = list.filter((e) => e.difficulty === Number(difficulty));
    if (age) {
      const a = Number(age);
      list = list.filter((e) => (e.minAge ?? 0) <= a && (e.maxAge ?? 99) >= a);
    }
    if (onlyFav) list = list.filter((e) => e.favorite);
    return list;
  }, [all, search, area, tag, difficulty, age, onlyFav]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = async (data: ExerciseForm) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        area: data.area || undefined,
        minAge: data.minAge,
        maxAge: data.maxAge,
        difficulty: data.difficulty as Exercise['difficulty'],
        objective: data.objective || undefined,
        durationMin: data.durationMin,
        playersMin: data.playersMin,
        playersMax: data.playersMax,
        materials: (data.materials ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        tags: data.tags,
      };
      if (modal.exercise) {
        await exercisesService.update(modal.exercise.id, payload);
        toast.success('Ejercicio actualizado');
      } else {
        await exercisesService.create({
          ...payload,
          code: `USR-${Date.now().toString(36).toUpperCase()}`,
          favorite: false,
          builtin: false,
        });
        toast.success('Ejercicio creado');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar el ejercicio');
    }
  };

  const remove = async (e: Exercise) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar ejercicio',
        message: `¿Eliminar "${e.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await exercisesService.remove(e.id);
    toast.success('Ejercicio eliminado');
  };

  return (
    <div>
      <PageHeader
        title="Biblioteca de ejercicios"
        subtitle={`${total ?? '…'} ejercicios · ${filtered.length} con filtros actuales`}
        actions={
          <Button onClick={() => setModal({ open: true, exercise: null })}>
            <Plus className="h-4 w-4" /> Nuevo ejercicio
          </Button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar ejercicio..."
          className="min-w-52 flex-1"
        />
        <Select
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setPage(1);
          }}
          className="w-36"
        >
          <option value="">Área</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {AREA_LABEL[a]}
            </option>
          ))}
        </Select>
        <Select
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
          className="w-36"
        >
          <option value="">Objetivo/tag</option>
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {TAG_LABEL[t]}
            </option>
          ))}
        </Select>
        <Select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="w-32"
        >
          <option value="">Dificultad</option>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>
              {'★'.repeat(d)}
            </option>
          ))}
        </Select>
        <Select
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            setPage(1);
          }}
          className="w-32"
        >
          <option value="">Edad</option>
          {[6, 8, 10, 12, 14, 16, 18].map((a) => (
            <option key={a} value={a}>
              {a} años
            </option>
          ))}
        </Select>
        <button
          onClick={() => {
            setOnlyFav((f) => !f);
            setPage(1);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium',
            onlyFav
              ? 'border-gold-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20'
              : 'border-zinc-300 text-zinc-500 dark:border-zinc-700',
          )}
        >
          <Star className={cn('h-4 w-4', onlyFav && 'fill-gold-500 text-gold-500')} /> Favoritos
        </button>
      </Card>

      {!all ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Dumbbell className="h-10 w-10" />}
            title="Sin ejercicios con estos filtros"
            message="Prueba ampliar la búsqueda o crea un ejercicio personalizado."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((e) => (
              <Card key={e.id} className="group flex flex-col p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" title={e.name}>
                      {e.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">{e.code}</p>
                  </div>
                  <button
                    onClick={() => exercisesService.toggleFavorite(e.id)}
                    className="rounded-lg p-1 text-zinc-300 hover:text-gold-500"
                    title="Favorito"
                  >
                    <Star className={cn('h-4 w-4', e.favorite && 'fill-gold-500 text-gold-500')} />
                  </button>
                </div>
                {e.description && (
                  <p className="mt-2 line-clamp-2 flex-1 text-xs text-zinc-500">{e.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.area && <Badge tone="green">{AREA_LABEL[e.area] ?? e.area}</Badge>}
                  <span className="inline-flex items-center gap-0.5">
                    <span className={cn('inline-block h-2 w-8 rounded-full', DIFF_COLORS[e.difficulty])} />
                    <span className="ml-1 text-[10px] text-zinc-400">Nv {e.difficulty}</span>
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    {e.minAge ?? '?'}-{e.maxAge ?? '?'} años
                    {e.durationMin ? ` · ${e.durationMin} min` : ''}
                    {e.playersMin ? ` · ${e.playersMin}-${e.playersMax ?? '?'} jug.` : ''}
                  </span>
                  <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setModal({ open: true, exercise: e })}
                      className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!e.builtin && (
                      <button
                        onClick={() => remove(e)}
                        className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          <Card className="mt-3">
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </Card>
        </>
      )}

      <ExerciseFormModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        exercise={modal.exercise}
        onSubmit={save}
      />
    </div>
  );
}
