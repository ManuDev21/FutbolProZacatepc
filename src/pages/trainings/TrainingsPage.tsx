import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCategories, useCoaches, useTrainings } from '@/hooks/useData';
import { trainingsService, trainingDuration } from '@/services/trainings.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, SearchInput, TableSkeleton } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { formatDate, fullName, matchesSearch, todayISO } from '@/lib/utils';
import type { Training } from '@/types';

const trainingSchema = z.object({
  name: z.string().min(2).max(80),
  categoryId: z.string().optional(),
  coachId: z.string().optional(),
  date: z.string().min(1, 'Obligatorio'),
  objective: z.string().max(120).optional(),
  level: z.enum(['iniciacion', 'basico', 'intermedio', 'avanzado', 'competitivo']),
  notes: z.string().max(1000).optional(),
});
type TrainingForm = z.infer<typeof trainingSchema>;

const LEVEL_LABEL: Record<string, string> = {
  iniciacion: 'Iniciación',
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  competitivo: 'Competitivo',
};

export default function TrainingsPage() {
  const trainings = useTrainings();
  const categories = useCategories();
  const coaches = useCoaches();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState<{ open: boolean; training?: Training | null }>({ open: false });
  const [saving, setSaving] = useState(false);

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);
  const coachName = useMemo(() => new Map((coaches ?? []).map((c) => [c.id, fullName(c)])), [coaches]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingForm>({
    resolver: zodResolver(trainingSchema),
    defaultValues: { level: 'intermedio', date: todayISO() },
  });

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.training
          ? {
              name: modal.training.name,
              categoryId: modal.training.categoryId ?? '',
              coachId: modal.training.coachId ?? '',
              date: modal.training.date,
              objective: modal.training.objective ?? '',
              level: modal.training.level,
              notes: modal.training.notes ?? '',
            }
          : { level: 'intermedio', date: todayISO() },
      );
    }
  }, [modal.open, modal.training, reset]);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      if (modal.training) {
        await trainingsService.update(modal.training.id, data);
        toast.success('Entrenamiento actualizado');
        setModal({ open: false });
      } else {
        const created = await trainingsService.create({ ...data, steps: [] });
        toast.success('Entrenamiento creado', 'Ahora agrega ejercicios a la sesión.');
        setModal({ open: false });
        navigate(`/app/entrenamientos/${created.id}`);
      }
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (t: Training) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar entrenamiento',
        message: `¿Eliminar "${t.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await trainingsService.remove(t.id);
    toast.success('Entrenamiento eliminado');
  };

  const duplicate = async (t: Training) => {
    const copy = await trainingsService.duplicate(t.id);
    if (copy) toast.success('Sesión duplicada', copy.name);
  };

  const filtered = (trainings ?? []).filter(
    (t) => matchesSearch([t.name, t.objective], search) && (!filterCat || t.categoryId === filterCat),
  );

  return (
    <div>
      <PageHeader
        title="Entrenamientos"
        subtitle={`${filtered.length} sesiones`}
        actions={
          <Button onClick={() => setModal({ open: true, training: null })}>
            <Plus className="h-4 w-4" /> Nueva sesión
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar sesión..."
            className="min-w-52 flex-1"
          />
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-40">
            <option value="">Todas las categorías</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {!trainings ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="h-10 w-10" />}
            title="Sin entrenamientos"
            message="Crea una sesión y ármala con la biblioteca de ejercicios."
            action={
              <Button size="sm" onClick={() => setModal({ open: true })}>
                <Plus className="h-4 w-4" /> Nueva sesión
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Sesión</Th>
                <Th>Fecha</Th>
                <Th>Categoría</Th>
                <Th>Entrenador</Th>
                <Th>Duración</Th>
                <Th>Nivel</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((t) => (
                <Tr
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/app/entrenamientos/${t.id}`)}
                >
                  <Td className="font-medium">{t.name}</Td>
                  <Td className="whitespace-nowrap text-zinc-500">{formatDate(t.date)}</Td>
                  <Td>{catName.get(t.categoryId ?? '') ?? '—'}</Td>
                  <Td className="text-zinc-500">{coachName.get(t.coachId ?? '') ?? '—'}</Td>
                  <Td>
                    <Badge tone="blue">{trainingDuration(t)} min</Badge>
                  </Td>
                  <Td>
                    <Badge tone="gray">{LEVEL_LABEL[t.level]}</Badge>
                  </Td>
                  <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Abrir constructor"
                        onClick={() => navigate(`/app/entrenamientos/${t.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicar" onClick={() => duplicate(t)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(t)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.training ? 'Editar sesión' : 'Nueva sesión'}
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
          <Field label="Nombre" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="Sesión técnica — Sub-13" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha" required error={errors.date?.message}>
              <Input type="date" {...register('date')} />
            </Field>
            <Field label="Nivel" error={errors.level?.message}>
              <Select {...register('level')}>
                {Object.entries(LEVEL_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoría" error={errors.categoryId?.message}>
              <Select {...register('categoryId')}>
                <option value="">Sin categoría</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Entrenador" error={errors.coachId?.message}>
              <Select {...register('coachId')}>
                <option value="">Sin asignar</option>
                {coaches?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fullName(c)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Objetivo" error={errors.objective?.message}>
            <Input {...register('objective')} placeholder="Posesión, presión, finalización..." />
          </Field>
          <Field label="Observaciones" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
