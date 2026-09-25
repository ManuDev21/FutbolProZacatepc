import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { exerciseSchema, numOrUndef, type ExerciseForm } from '@/lib/validators';
import type { Exercise } from '@/types';

const TAGS = ['tecnica', 'tactica', 'fisico', 'finalizacion', 'posesion', 'velocidad', 'coordinacion'];
const AREAS = [
  ['tecnica', 'Técnica'],
  ['tactica', 'Táctica'],
  ['fisico', 'Físico'],
  ['porteros', 'Porteros'],
] as const;

export function ExerciseFormModal({
  open,
  onClose,
  exercise,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  exercise?: Exercise | null;
  onSubmit: (data: ExerciseForm) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExerciseForm>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { difficulty: 3, tags: [] },
  });

  const tags = watch('tags');

  useEffect(() => {
    if (open) {
      reset(
        exercise
          ? {
              name: exercise.name,
              description: exercise.description ?? '',
              area: exercise.area ?? '',
              minAge: exercise.minAge,
              maxAge: exercise.maxAge,
              difficulty: exercise.difficulty,
              objective: exercise.objective ?? '',
              durationMin: exercise.durationMin,
              playersMin: exercise.playersMin,
              playersMax: exercise.playersMax,
              materials: exercise.materials.join(', '),
              tags: exercise.tags,
            }
          : { difficulty: 3, tags: [] },
      );
    }
  }, [open, exercise, reset]);

  const submit = handleSubmit(async (data) => {
    setSaving(true);
    try {
      await onSubmit(data);
    } finally {
      setSaving(false);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="Rondo 4v2" />
        </Field>
        <Field label="Descripción" error={errors.description?.message}>
          <Textarea {...register('description')} rows={3} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Área" error={errors.area?.message}>
            <Select {...register('area')}>
              <option value="">—</option>
              {AREAS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Edad mín." error={errors.minAge?.message}>
            <Input type="number" {...register('minAge', numOrUndef)} />
          </Field>
          <Field label="Edad máx." error={errors.maxAge?.message}>
            <Input type="number" {...register('maxAge', numOrUndef)} />
          </Field>
          <Field label="Dificultad (1-5)" required error={errors.difficulty?.message}>
            <Select {...register('difficulty', { setValueAs: (v) => Number(v) })}>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d} — {'★'.repeat(d)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duración (min)" error={errors.durationMin?.message}>
            <Input type="number" {...register('durationMin', numOrUndef)} />
          </Field>
          <Field label="Objetivo" error={errors.objective?.message}>
            <Input {...register('objective')} placeholder="Posesión, finalización..." />
          </Field>
          <Field label="Jugadores mín." error={errors.playersMin?.message}>
            <Input type="number" {...register('playersMin', numOrUndef)} />
          </Field>
          <Field label="Jugadores máx." error={errors.playersMax?.message}>
            <Input type="number" {...register('playersMax', numOrUndef)} />
          </Field>
        </div>
        <Field
          label="Material"
          error={errors.materials?.message}
          hint="Separado por comas: conos, petos, balones"
        >
          <Input {...register('materials')} />
        </Field>
        <Field label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  const set = new Set(tags ?? []);
                  if (set.has(t)) set.delete(t);
                  else set.add(t);
                  setValue('tags', [...set]);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                  tags?.includes(t)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20'
                    : 'border-zinc-300 text-zinc-500 dark:border-zinc-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
