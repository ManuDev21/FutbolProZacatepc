import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useCategories, usePlayers } from '@/hooks/useData';
import { categoriesService } from '@/services/categories.service';
import { playersService } from '@/services/players.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Switch } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { EmptyState, PageHeader, SearchInput, TableSkeleton } from '@/components/ui/misc';
import { categorySchema, type CategoryForm } from '@/lib/validators';
import { matchesSearch } from '@/lib/utils';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const categories = useCategories();
  const players = usePlayers();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; cat?: Category | null }>({ open: false });
  const [saving, setSaving] = useState(false);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of players ?? []) {
      if (p.status !== 'baja' && p.categoryId) m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
    }
    return m;
  }, [players]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { active: true, format: 7 },
  });

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.cat
          ? {
              name: modal.cat.name,
              minAge: modal.cat.minAge,
              maxAge: modal.cat.maxAge,
              description: modal.cat.description ?? '',
              format: modal.cat.format,
              active: modal.cat.active,
            }
          : { active: true, format: 7, name: '', description: '' },
      );
    }
  }, [modal.open, modal.cat, reset]);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      if (modal.cat) {
        await categoriesService.update(modal.cat.id, { ...data, format: data.format as 7 | 11 });
        toast.success('Categoría actualizada');
      } else {
        await categoriesService.create({ ...data, format: data.format as 7 | 11 });
        toast.success('Categoría creada');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (c: Category) => {
    const n = counts.get(c.id) ?? 0;
    const ok = await confirmDialog({
      title: 'Eliminar categoría',
      message:
        n > 0
          ? `La categoría ${c.name} tiene ${n} jugadores asignados. Los jugadores quedarán sin categoría. ¿Continuar?`
          : `¿Eliminar la categoría ${c.name}?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    if (n > 0) {
      const affected = (players ?? []).filter((p) => p.categoryId === c.id);
      await Promise.all(affected.map((p) => playersService.update(p.id, { categoryId: undefined })));
    }
    await categoriesService.remove(c.id);
    toast.success('Categoría eliminada', c.name);
  };

  const filtered = (categories ?? []).filter((c) => matchesSearch([c.name, c.description], search));

  return (
    <div>
      <PageHeader
        title="Categorías"
        subtitle="F7 para Sub-7 y Sub-13 · F11 solo Sub-17"
        actions={
          <Button onClick={() => setModal({ open: true, cat: null })}>
            <Plus className="h-4 w-4" /> Nueva categoría
          </Button>
        }
      />
      <Card>
        <div className="border-b border-zinc-100 p-3 dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} className="max-w-xs" />
        </div>
        {!categories ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-10 w-10" />}
            title="No existen categorías"
            action={
              <Button size="sm" onClick={() => setModal({ open: true, cat: null })}>
                <Plus className="h-4 w-4" /> Crear
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Nombre</Th>
                <Th>Edades</Th>
                <Th>Formato</Th>
                <Th>Jugadores</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <p className="font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-zinc-400">{c.description}</p>}
                  </Td>
                  <Td>
                    {c.minAge} – {c.maxAge} años
                  </Td>
                  <Td>
                    <Badge tone={c.format === 11 ? 'blue' : 'green'}>Fútbol {c.format}</Badge>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      {counts.get(c.id) ?? 0}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Activa' : 'Inactiva'}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setModal({ open: true, cat: c })}>
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
        title={modal.cat ? 'Editar categoría' : 'Nueva categoría'}
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
            <Input {...register('name')} placeholder="Sub-15" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Edad mínima" required error={errors.minAge?.message}>
              <Input type="number" {...register('minAge', { valueAsNumber: true })} />
            </Field>
            <Field label="Edad máxima" required error={errors.maxAge?.message}>
              <Input type="number" {...register('maxAge', { valueAsNumber: true })} />
            </Field>
          </div>
          <Field
            label="Formato de juego"
            required
            error={errors.format?.message}
            hint="Solo Sub-17 juega Fútbol 11"
          >
            <Select {...register('format', { setValueAs: (v) => Number(v) })}>
              <option value={7}>Fútbol 7</option>
              <option value={11}>Fútbol 11</option>
            </Select>
          </Field>
          <Field label="Descripción" error={errors.description?.message}>
            <Textarea {...register('description')} />
          </Field>
          <Switch
            checked={watch('active')}
            onChange={(v) => setValue('active', v)}
            label="Categoría activa"
          />
        </div>
      </Modal>
    </div>
  );
}
