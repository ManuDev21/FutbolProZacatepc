import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import { useCategories, useCoaches, usePlayers, useTeams } from '@/hooks/useData';
import { teamsService } from '@/services/teams.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, SearchInput, Switch, TableSkeleton } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { teamSchema, type TeamForm } from '@/lib/validators';
import { fullName, matchesSearch } from '@/lib/utils';
import type { Team } from '@/types';

export default function TeamsPage() {
  const teams = useTeams();
  const categories = useCategories();
  const coaches = useCoaches();
  const players = usePlayers();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; team?: Team | null }>({ open: false });
  const [saving, setSaving] = useState(false);

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);
  const coachName = useMemo(() => new Map((coaches ?? []).map((c) => [c.id, fullName(c)])), [coaches]);
  const playerName = useMemo(() => new Map((players ?? []).map((p) => [p.id, fullName(p)])), [players]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: { active: true, playerIds: [] },
  });

  const selectedCategory = watch('categoryId');
  const selectedPlayers = watch('playerIds');

  const eligiblePlayers = useMemo(
    () =>
      (players ?? []).filter(
        (p) => p.status === 'activo' && (!selectedCategory || p.categoryId === selectedCategory),
      ),
    [players, selectedCategory],
  );

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.team
          ? {
              name: modal.team.name,
              categoryId: modal.team.categoryId ?? '',
              coachId: modal.team.coachId ?? '',
              playerIds: modal.team.playerIds,
              active: modal.team.active,
            }
          : { active: true, playerIds: [] },
      );
    }
  }, [modal.open, modal.team, reset]);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      if (modal.team) {
        await teamsService.update(modal.team.id, data);
        toast.success('Equipo actualizado');
      } else {
        await teamsService.create(data);
        toast.success('Equipo creado');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (t: Team) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar equipo',
        message: `¿Eliminar el equipo "${t.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await teamsService.remove(t.id);
    toast.success('Equipo eliminado');
  };

  const filtered = (teams ?? []).filter((t) => matchesSearch([t.name], search));

  return (
    <div>
      <PageHeader
        title="Equipos"
        subtitle="Plantillas por categoría"
        actions={
          <Button onClick={() => setModal({ open: true, team: null })}>
            <Plus className="h-4 w-4" /> Nuevo equipo
          </Button>
        }
      />
      <Card>
        <div className="border-b border-zinc-100 p-3 dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} className="max-w-xs" />
        </div>
        {!teams ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Shield className="h-10 w-10" />} title="No hay equipos" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Equipo</Th>
                <Th>Categoría</Th>
                <Th>Entrenador</Th>
                <Th>Jugadores</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((t) => (
                <Tr key={t.id}>
                  <Td className="font-medium">{t.name}</Td>
                  <Td>
                    {t.categoryId ? (
                      <Badge tone="green">
                        {catName.get(t.categoryId)?.name} · F{catName.get(t.categoryId)?.format}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td className="text-zinc-500">{coachName.get(t.coachId ?? '') ?? '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {t.playerIds.slice(0, 4).map((id) => (
                        <Badge key={id} tone="gray">
                          {playerName.get(id) ?? '?'}
                        </Badge>
                      ))}
                      {t.playerIds.length > 4 && <Badge>+{t.playerIds.length - 4}</Badge>}
                      {t.playerIds.length === 0 && (
                        <span className="text-xs text-zinc-400">Sin jugadores</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={t.active ? 'green' : 'gray'}>{t.active ? 'Activo' : 'Inactivo'}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setModal({ open: true, team: t })}>
                        <Pencil className="h-4 w-4" />
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
        title={modal.team ? 'Editar equipo' : 'Nuevo equipo'}
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
          <Field label="Nombre del equipo" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="Cañeros Sub-13" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" error={errors.categoryId?.message}>
              <Select {...register('categoryId')}>
                <option value="">Sin categoría</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (F{c.format})
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
          <Field
            label="Jugadores"
            hint={selectedCategory ? 'Se muestran solo jugadores de la categoría' : undefined}
          >
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
              {eligiblePlayers.length === 0 && (
                <p className="px-2 py-1 text-xs text-zinc-400">Sin jugadores disponibles</p>
              )}
              {eligiblePlayers.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers?.includes(p.id)}
                    onChange={(e) => {
                      const set = new Set(selectedPlayers ?? []);
                      if (e.target.checked) set.add(p.id);
                      else set.delete(p.id);
                      setValue('playerIds', [...set]);
                    }}
                    className="accent-brand-600"
                  />
                  <span>{fullName(p)}</span>
                  {p.jerseyNumber != null && <span className="text-xs text-zinc-400">#{p.jerseyNumber}</span>}
                </label>
              ))}
            </div>
          </Field>
          <Switch checked={watch('active')} onChange={(v) => setValue('active', v)} label="Equipo activo" />
        </div>
      </Modal>
    </div>
  );
}
