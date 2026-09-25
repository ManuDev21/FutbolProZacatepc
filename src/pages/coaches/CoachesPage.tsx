import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, ContactRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCategories, useCoaches } from '@/hooks/useData';
import { coachesService } from '@/services/coaches.service';
import { fileToCompressedDataUrl } from '@/lib/image';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { Avatar, EmptyState, PageHeader, SearchInput, Switch, TableSkeleton } from '@/components/ui/misc';
import { coachSchema, numOrUndef, type CoachForm } from '@/lib/validators';
import { fullName, matchesSearch } from '@/lib/utils';
import type { Coach } from '@/types';

export default function CoachesPage() {
  const coaches = useCoaches();
  const categories = useCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState<{ open: boolean; coach?: Coach | null }>({ open: false });
  const [photo, setPhoto] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CoachForm>({
    resolver: zodResolver(coachSchema),
    defaultValues: { active: true, categoryIds: [] },
  });

  const catIds = watch('categoryIds');

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.coach
          ? {
              firstName: modal.coach.firstName,
              lastName: modal.coach.lastName,
              phone: modal.coach.phone ?? '',
              email: modal.coach.email ?? '',
              specialty: modal.coach.specialty ?? '',
              experienceYears: modal.coach.experienceYears,
              categoryIds: modal.coach.categoryIds,
              active: modal.coach.active,
            }
          : { active: true, categoryIds: [] },
      );
      setPhoto(modal.coach?.photo);
    }
  }, [modal.open, modal.coach, reset]);

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const filtered = (coaches ?? []).filter(
    (c) =>
      matchesSearch([c.firstName, c.lastName, c.specialty], search) &&
      (!filterCat || c.categoryIds.includes(filterCat)),
  );

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      const payload = { ...data, photo };
      if (modal.coach) {
        await coachesService.update(modal.coach.id, payload);
        toast.success('Entrenador actualizado');
      } else {
        await coachesService.create(payload);
        toast.success('Entrenador creado');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (c: Coach) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar entrenador',
        message: `¿Eliminar a ${fullName(c)}?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await coachesService.remove(c.id);
    toast.success('Entrenador eliminado');
  };

  const pickPhoto = async (f?: File | null) => {
    if (!f) return;
    try {
      setPhoto(await fileToCompressedDataUrl(f, 320));
    } catch (e) {
      toast.error('Imagen no válida', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <div>
      <PageHeader
        title="Entrenadores"
        subtitle={`${filtered.length} registrado(s)`}
        actions={
          <Button onClick={() => setModal({ open: true, coach: null })}>
            <Plus className="h-4 w-4" /> Nuevo entrenador
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
          <SearchInput
            value={search}
            onChange={setSearch}
            className="min-w-52 flex-1"
            placeholder="Buscar entrenador..."
          />
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-44">
            <option value="">Todas las categorías</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {!coaches ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ContactRound className="h-10 w-10" />} title="No hay entrenadores" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Entrenador</Th>
                <Th>Especialidad</Th>
                <Th>Experiencia</Th>
                <Th>Categorías</Th>
                <Th>Contacto</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar src={c.photo} name={fullName(c)} size="sm" />
                      <span className="font-medium">{fullName(c)}</span>
                    </div>
                  </Td>
                  <Td className="text-zinc-500">{c.specialty ?? '—'}</Td>
                  <Td>{c.experienceYears != null ? `${c.experienceYears} años` : '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {c.categoryIds.length === 0 ? (
                        <span className="text-xs text-zinc-400">—</span>
                      ) : (
                        c.categoryIds.map((id) => (
                          <Badge key={id} tone="green">
                            {catName.get(id) ?? '?'}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td className="text-xs text-zinc-500">
                    {c.phone && <p>{c.phone}</p>}
                    {c.email && <p>{c.email}</p>}
                  </Td>
                  <Td>
                    <Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setModal({ open: true, coach: c })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(c)}>
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
        title={modal.coach ? 'Editar entrenador' : 'Nuevo entrenador'}
        size="lg"
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
          <div className="flex items-center gap-4">
            <Avatar src={photo} name={`${watch('firstName') ?? ''}`} size="lg" />
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> Foto
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" required error={errors.firstName?.message}>
              <Input {...register('firstName')} />
            </Field>
            <Field label="Apellido" required error={errors.lastName?.message}>
              <Input {...register('lastName')} />
            </Field>
            <Field label="Teléfono" error={errors.phone?.message}>
              <Input {...register('phone')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register('email')} />
            </Field>
            <Field label="Especialidad" error={errors.specialty?.message}>
              <Input {...register('specialty')} placeholder="Técnica, porteros, físico..." />
            </Field>
            <Field label="Años de experiencia" error={errors.experienceYears?.message}>
              <Input type="number" {...register('experienceYears', numOrUndef)} />
            </Field>
          </div>
          <Field label="Categorías asignadas">
            <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              {(categories ?? []).map((c) => (
                <label
                  key={c.id}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-sm dark:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={catIds?.includes(c.id)}
                    onChange={(e) => {
                      const set = new Set(catIds ?? []);
                      if (e.target.checked) set.add(c.id);
                      else set.delete(c.id);
                      setValue('categoryIds', [...set]);
                    }}
                    className="accent-brand-600"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </Field>
          <Switch
            checked={watch('active')}
            onChange={(v) => setValue('active', v)}
            label="Entrenador activo"
          />
        </div>
      </Modal>
    </div>
  );
}
