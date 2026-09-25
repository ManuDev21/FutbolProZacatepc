import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageCircle, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { useGuardians, usePlayers } from '@/hooks/useData';
import { guardiansService } from '@/services/guardians.service';
import { openWhatsApp } from '@/services/whatsapp.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { EmptyState, PageHeader, SearchInput, TableSkeleton } from '@/components/ui/misc';
import { guardianSchema, type GuardianForm } from '@/lib/validators';
import { fullName, matchesSearch } from '@/lib/utils';
import type { Guardian } from '@/types';

const RELATIONS = ['Padre', 'Madre', 'Tutor', 'Abuelo/a', 'Tío/a', 'Otro'];

export default function GuardiansPage() {
  const guardians = useGuardians();
  const players = usePlayers();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; guardian?: Guardian | null }>({ open: false });
  const [saving, setSaving] = useState(false);

  const playerName = useMemo(() => new Map((players ?? []).map((p) => [p.id, fullName(p)])), [players]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GuardianForm>({
    resolver: zodResolver(guardianSchema),
    defaultValues: { playerIds: [], relationship: 'Padre' },
  });

  const playerIds = watch('playerIds');

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.guardian
          ? {
              firstName: modal.guardian.firstName,
              lastName: modal.guardian.lastName,
              phone: modal.guardian.phone ?? '',
              whatsapp: modal.guardian.whatsapp ?? '',
              email: modal.guardian.email ?? '',
              relationship: modal.guardian.relationship ?? 'Padre',
              playerIds: modal.guardian.playerIds,
            }
          : { playerIds: [], relationship: 'Padre' },
      );
    }
  }, [modal.open, modal.guardian, reset]);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      if (modal.guardian) {
        await guardiansService.update(modal.guardian.id, data);
        toast.success('Tutor actualizado');
      } else {
        await guardiansService.create(data);
        toast.success('Tutor registrado');
      }
      setModal({ open: false });
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  const remove = async (g: Guardian) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar tutor',
        message: `¿Eliminar a ${fullName(g)}?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await guardiansService.remove(g.id);
    toast.success('Tutor eliminado');
  };

  const filtered = (guardians ?? []).filter((g) =>
    matchesSearch([g.firstName, g.lastName, g.email, g.relationship], search),
  );

  return (
    <div>
      <PageHeader
        title="Padres / Tutores"
        subtitle={`${filtered.length} registrado(s)`}
        actions={
          <Button onClick={() => setModal({ open: true, guardian: null })}>
            <Plus className="h-4 w-4" /> Nuevo tutor
          </Button>
        }
      />
      <Card>
        <div className="border-b border-zinc-100 p-3 dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} className="max-w-xs" />
        </div>
        {!guardians ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<UsersRound className="h-10 w-10" />} title="No hay tutores registrados" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Nombre</Th>
                <Th>Parentesco</Th>
                <Th>Contacto</Th>
                <Th>Jugadores</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((g) => (
                <Tr key={g.id}>
                  <Td className="font-medium">{fullName(g)}</Td>
                  <Td>
                    <Badge tone="blue">{g.relationship ?? 'Tutor'}</Badge>
                  </Td>
                  <Td className="text-xs text-zinc-500">
                    {g.phone && <p>{g.phone}</p>}
                    {g.email && <p>{g.email}</p>}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {g.playerIds.length === 0 ? (
                        <span className="text-xs text-zinc-400">—</span>
                      ) : (
                        g.playerIds.map((id) => (
                          <Badge key={id} tone="green">
                            {playerName.get(id) ?? '?'}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      {g.whatsapp && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="WhatsApp"
                          onClick={() =>
                            openWhatsApp(g.whatsapp, `Hola ${g.firstName}, te saluda FútbolPro Zacatepec ⚽`)
                          }
                        >
                          <MessageCircle className="h-4 w-4 text-[#25D366]" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setModal({ open: true, guardian: g })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(g)}>
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
        title={modal.guardian ? 'Editar tutor' : 'Nuevo tutor'}
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
            <Field label="WhatsApp" error={errors.whatsapp?.message} hint="Con lada, ej. 7771234567">
              <Input {...register('whatsapp')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register('email')} />
            </Field>
            <Field label="Parentesco" error={errors.relationship?.message}>
              <Select {...register('relationship')}>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Jugadores asociados" hint="Selecciona los jugadores a cargo de este tutor">
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
              {(players ?? []).map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={playerIds?.includes(p.id)}
                    onChange={(e) => {
                      const set = new Set(playerIds ?? []);
                      if (e.target.checked) set.add(p.id);
                      else set.delete(p.id);
                      setValue('playerIds', [...set]);
                    }}
                    className="accent-brand-600"
                  />
                  {fullName(p)}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
