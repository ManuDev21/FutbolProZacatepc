import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Avatar } from '@/components/ui/misc';
import { playerSchema, numOrUndef, type PlayerForm } from '@/lib/validators';
import { fileToCompressedDataUrl } from '@/lib/image';
import { toast } from '@/stores/toast';
import { todayISO } from '@/lib/utils';
import type { Category, Guardian, Player } from '@/types';
import { POSITIONS_F11, POSITIONS_F7 } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  player?: Player | null;
  categories?: Category[];
  guardians?: Guardian[];
  onSubmit: (data: PlayerForm & { photo?: string }) => Promise<void>;
}

export function PlayerFormModal({ open, onClose, player, categories, guardians, onSubmit }: Props) {
  const [photo, setPhoto] = useState<string | undefined>(player?.photo);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      status: 'activo',
      joinedAt: todayISO(),
    },
  });

  const categoryId = watch('categoryId');
  const format = categories?.find((c) => c.id === categoryId)?.format ?? 11;
  const positions = format === 7 ? POSITIONS_F7 : POSITIONS_F11;

  useEffect(() => {
    if (open) {
      reset(
        player
          ? {
              firstName: player.firstName,
              lastName: player.lastName,
              birthDate: player.birthDate,
              categoryId: player.categoryId ?? '',
              position: player.position ?? '',
              jerseyNumber: player.jerseyNumber,
              phone: player.phone ?? '',
              status: player.status,
              joinedAt: player.joinedAt,
              guardianId: player.guardianId ?? '',
              notes: player.notes ?? '',
            }
          : { status: 'activo', joinedAt: todayISO() },
      );
      setPhoto(player?.photo);
    }
  }, [open, player, reset]);

  const pickPhoto = async (file?: File | null) => {
    if (!file) return;
    try {
      setPhoto(await fileToCompressedDataUrl(file, 320));
    } catch (e) {
      toast.error('Imagen no válida', e instanceof Error ? e.message : undefined);
    }
  };

  const submit = handleSubmit(async (data) => {
    setSaving(true);
    try {
      await onSubmit({ ...data, photo });
      onClose();
    } finally {
      setSaving(false);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={player ? 'Editar jugador' : 'Nuevo jugador'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving}>
            {player ? 'Guardar cambios' : 'Crear jugador'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Foto */}
        <div className="flex items-center gap-4">
          <Avatar src={photo} name={`${watch('firstName') ?? ''} ${watch('lastName') ?? ''}`} size="lg" />
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> {photo ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            <p className="mt-1 text-xs text-zinc-400">JPG, PNG o WebP · se comprime localmente</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" required error={errors.firstName?.message}>
            <Input {...register('firstName')} placeholder="Mateo" />
          </Field>
          <Field label="Apellido" required error={errors.lastName?.message}>
            <Input {...register('lastName')} placeholder="Hernández López" />
          </Field>
          <Field label="Fecha de nacimiento" required error={errors.birthDate?.message}>
            <Input type="date" {...register('birthDate')} />
          </Field>
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
          <Field label="Posición" error={errors.position?.message}>
            <Select {...register('position')}>
              <option value="">Sin definir</option>
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Número" error={errors.jerseyNumber?.message}>
            <Input
              type="number"
              min={0}
              max={99}
              {...register('jerseyNumber', numOrUndef)}
              placeholder="10"
            />
          </Field>
          <Field label="Teléfono" error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="777 123 4567" />
          </Field>
          <Field label="Estado" required error={errors.status?.message}>
            <Select {...register('status')}>
              <option value="activo">Activo</option>
              <option value="lesionado">Lesionado</option>
              <option value="inactivo">Inactivo</option>
              <option value="baja">Baja</option>
            </Select>
          </Field>
          <Field label="Fecha de ingreso" required error={errors.joinedAt?.message}>
            <Input type="date" {...register('joinedAt')} />
          </Field>
          <Field label="Padre / Tutor" error={errors.guardianId?.message}>
            <Select {...register('guardianId')}>
              <option value="">Sin tutor asignado</option>
              {guardians?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.firstName} {g.lastName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Observaciones" error={errors.notes?.message}>
          <Textarea {...register('notes')} placeholder="Alergias, condiciones, notas del staff..." />
        </Field>
      </div>
    </Modal>
  );
}
