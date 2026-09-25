import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Goal, RotateCcw, Save, Trash2, Users, X } from 'lucide-react';
import { useCategories, useLineups, usePlayers } from '@/hooks/useData';
import { lineupsService } from '@/services/lineups.service';
import { defaultFormation, formationsFor } from '@/data/formations';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, EmptyState, PageHeader } from '@/components/ui/misc';
import { clamp, cn, fullName, initials } from '@/lib/utils';
import type { Category, Lineup, LineupSlot, Player } from '@/types';

/**
 * Pizarra táctica tipo rompecabezas:
 * el profesor elige una formación y arrastra las piezas (jugadores)
 * a las posiciones de la cancha. F7 → Sub-7/Sub-13, F11 → Sub-17.
 */
export default function TacticsPage() {
  const categories = useCategories();
  const players = usePlayers();
  const [categoryId, setCategoryId] = useState('');
  const lineups = useLineups(categoryId || undefined);

  const category: Category | undefined = useMemo(
    () => categories?.find((c) => c.id === categoryId) ?? categories?.[0],
    [categories, categoryId],
  );

  useEffect(() => {
    if (!categoryId && categories?.length) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const format = category?.format ?? 7;
  const formations = formationsFor(format);

  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [draftName, setDraftName] = useState('');
  const [slots, setSlots] = useState<LineupSlot[]>([]);
  const [formation, setFormation] = useState('');
  const [dirty, setDirty] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);
  const dragSlot = useRef<string | null>(null);

  const roster = useMemo(
    () =>
      (players ?? [])
        .filter((p) => p.categoryId === category?.id && (p.status === 'activo' || p.status === 'lesionado'))
        .sort((a, b) => fullName(a).localeCompare(fullName(b), 'es')),
    [players, category],
  );

  const playerById = useMemo(() => new Map((players ?? []).map((p) => [p.id, p])), [players]);
  const assignedIds = useMemo(() => new Set(slots.map((s) => s.playerId).filter(Boolean)), [slots]);
  const bench = roster.filter((p) => !assignedIds.has(p.id));

  const loadLineup = (l: Lineup | null, form?: string) => {
    const f = form ?? l?.formation ?? defaultFormation(format);
    setLineup(l);
    setFormation(f);
    setDraftName(l?.name ?? `Alineación ${f}`);
    setSlots(l ? l.slots.map((s) => ({ ...s })) : formations[f].map((s) => ({ ...s })));
    setDirty(false);
    setSelectedPlayer(null);
  };

  // Cuando cambia la categoría, carga la primera alineación guardada o preset
  useEffect(() => {
    if (!category) return;
    const saved = (lineups ?? []).at(-1);
    if (saved && saved.format === category.format) {
      setLineup(saved);
      setFormation(saved.formation);
      setDraftName(saved.name);
      setSlots(saved.slots.map((s) => ({ ...s })));
    } else {
      loadLineup(null);
    }
    setSelectedPlayer(null);
    setDirty(false);
  }, [category?.id, lineups]);

  const applyFormation = (f: string) => {
    if (dirty) {
      confirmDialog({
        title: 'Cambiar formación',
        message: 'Se reiniciarán las posiciones con la nueva formación. ¿Continuar?',
        confirmLabel: 'Cambiar',
      }).then((ok) => {
        if (ok) {
          setFormation(f);
          setSlots(formations[f].map((s) => ({ ...s })));
          setDirty(true);
        }
      });
    } else {
      setFormation(f);
      setSlots(formations[f].map((s) => ({ ...s })));
      setDirty(true);
    }
  };

  // ---------- Drag de piezas sobre la cancha ----------

  const onSlotPointerDown = (e: React.PointerEvent, slotKey: string) => {
    const pitch = pitchRef.current;
    if (!pitch) return;
    e.preventDefault();
    dragSlot.current = slotKey;
    const rect = pitch.getBoundingClientRect();

    const move = (ev: PointerEvent) => {
      if (dragSlot.current !== slotKey) return;
      const x = clamp((ev.clientX - rect.left) / rect.width, 0.02, 0.98);
      const y = clamp((ev.clientY - rect.top) / rect.height, 0.03, 0.97);
      setSlots((s) => s.map((sl) => (sl.key === slotKey ? { ...sl, x, y: 1 - y } : sl)));
      setDirty(true);
    };
    const up = () => {
      dragSlot.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ---------- Asignación jugador ↔ posición ----------

  const clickSlot = (slotKey: string) => {
    if (selectedPlayer) {
      setSlots((s) => s.map((sl) => (sl.key === slotKey ? { ...sl, playerId: selectedPlayer } : sl)));
      setSelectedPlayer(null);
      setDirty(true);
    } else {
      // click en slot ocupado → quita al jugador (regresa a la banca)
      const slot = slots.find((s) => s.key === slotKey);
      if (slot?.playerId) {
        setSlots((s) => s.map((sl) => (sl.key === slotKey ? { ...sl, playerId: undefined } : sl)));
        setDirty(true);
      }
    }
  };

  const removeFromSlot = (slotKey: string) => {
    setSlots((s) => s.map((sl) => (sl.key === slotKey ? { ...sl, playerId: undefined } : sl)));
    setDirty(true);
  };

  // Drag & drop HTML5 desde la banca (escritorio)
  const onDropToSlot = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    const pid = e.dataTransfer.getData('text/player-id');
    if (!pid) return;
    setSlots((s) => s.map((sl) => (sl.key === slotKey ? { ...sl, playerId: pid } : sl)));
    setDirty(true);
  };

  const save = async () => {
    if (!category) return;
    if (!draftName.trim()) {
      toast.warning('Ponle nombre a la alineación');
      return;
    }
    setSaving(true);
    try {
      if (lineup) {
        await lineupsService.update(lineup.id, {
          name: draftName.trim(),
          formation,
          slots,
        });
        toast.success('Alineación actualizada', `${draftName} · ${formation}`);
      } else {
        const created = await lineupsService.create({
          categoryId: category.id,
          name: draftName.trim(),
          formation,
          format,
          slots,
        });
        setLineup(created);
        toast.success('Alineación guardada', `${draftName} · ${formation}`);
      }
      setDirty(false);
    } catch {
      toast.error('No se pudo guardar la alineación');
    } finally {
      setSaving(false);
    }
  };

  const saveAsNew = async () => {
    if (!category) return;
    const name = `${draftName || `Alineación ${formation}`} (nueva)`;
    const created = await lineupsService.create({
      categoryId: category.id,
      name,
      formation,
      format,
      slots,
    });
    setLineup(created);
    setDraftName(name);
    setDirty(false);
    toast.success('Copia guardada', name);
  };

  const removeLineup = async (l: Lineup) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar alineación',
        message: `¿Eliminar "${l.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await lineupsService.remove(l.id);
    if (lineup?.id === l.id) loadLineup(null);
    toast.success('Alineación eliminada');
  };

  const playerOf = (p?: string): Player | undefined => (p ? playerById.get(p) : undefined);

  return (
    <div>
      <PageHeader
        title="Pizarra táctica"
        subtitle={
          category
            ? `${category.name} · Fútbol ${category.format} · arrastra las piezas o toca un jugador y luego una posición`
            : 'Diseña tu cuadro'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {lineup && (
              <Button variant="secondary" size="sm" onClick={saveAsNew}>
                <Copy className="h-4 w-4" /> Guardar como nueva
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => loadLineup(null)}>
              <RotateCcw className="h-4 w-4" /> Reiniciar
            </Button>
            <Button size="sm" onClick={save} loading={saving} disabled={!category}>
              <Save className="h-4 w-4" /> {lineup ? 'Guardar' : 'Crear'} alineación
            </Button>
          </div>
        }
      />

      {/* Controles */}
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Categoría">
            <Select value={category?.id ?? ''} onChange={(e) => setCategoryId(e.target.value)}>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (F{c.format})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Formación">
            <Select value={formation} onChange={(e) => applyFormation(e.target.value)}>
              {Object.keys(formations).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre de la alineación" className="sm:col-span-2">
            <Input
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                setDirty(true);
              }}
            />
          </Field>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        {/* Cancha */}
        <Card className="overflow-hidden">
          <div
            ref={pitchRef}
            className="relative mx-auto aspect-[3/4] w-full max-w-2xl touch-none select-none sm:aspect-[4/3]"
            style={{
              background: 'repeating-linear-gradient(0deg, #177541 0 10%, #126534 10% 20%)',
            }}
          >
            {/* Líneas de la cancha */}
            <div className="pointer-events-none absolute inset-3 rounded-sm border-2 border-white/70" />
            <div className="pointer-events-none absolute top-1/2 right-3 left-3 h-0.5 bg-white/70" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-[22%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
            {/* Áreas */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 h-[13%] w-[42%] -translate-x-1/2 border-2 border-b-0 border-white/70" />
            <div className="pointer-events-none absolute top-3 left-1/2 h-[13%] w-[42%] -translate-x-1/2 border-2 border-t-0 border-white/70" />
            <div className="pointer-events-none absolute bottom-3 left-1/2 h-[5.5%] w-[18%] -translate-x-1/2 border-2 border-b-0 border-white/70" />
            <div className="pointer-events-none absolute top-3 left-1/2 h-[5.5%] w-[18%] -translate-x-1/2 border-2 border-t-0 border-white/70" />
            {/* Porterías */}
            <div className="pointer-events-none absolute bottom-0.5 left-1/2 h-1.5 w-[14%] -translate-x-1/2 rounded-t bg-white/60" />
            <div className="pointer-events-none absolute top-0.5 left-1/2 h-1.5 w-[14%] -translate-x-1/2 rounded-b bg-white/60" />

            {/* Piezas */}
            {slots.map((s) => {
              const p = playerOf(s.playerId);
              return (
                <div
                  key={s.key}
                  onPointerDown={(e) => onSlotPointerDown(e, s.key)}
                  onClick={() => clickSlot(s.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropToSlot(e, s.key)}
                  className={cn(
                    'group absolute flex w-14 -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center active:cursor-grabbing',
                    selectedPlayer && 'hover:scale-105',
                  )}
                  style={{ left: `${s.x * 100}%`, top: `${(1 - s.y) * 100}%` }}
                >
                  <div
                    className={cn(
                      'relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg transition-transform',
                      p
                        ? 'border-gold-400 bg-brand-700'
                        : 'border-dashed border-white/80 bg-white/15 backdrop-blur-[1px]',
                      selectedPlayer && !p && 'border-gold-400 bg-gold-500/30',
                    )}
                  >
                    {p ? (
                      p.photo ? (
                        <img src={p.photo} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black text-white">
                          {initials(p.firstName, p.lastName)}
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] font-bold text-white">{s.label}</span>
                    )}
                    {p && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSlot(s.key);
                        }}
                        className="absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <span className="mt-0.5 max-w-16 truncate rounded bg-black/50 px-1 text-[9px] font-medium text-white">
                    {p ? p.lastName.split(' ')[0] : s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-800">
            <span>
              {slots.filter((s) => s.playerId).length} de {format} posiciones ocupadas
            </span>
            <span>{dirty ? '● Cambios sin guardar' : 'Sin cambios'}</span>
          </div>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Convocatoria"
              subtitle={`${bench.length} en banca · ${slots.filter((s) => s.playerId).length} titulares`}
            />
            <CardBody className="max-h-[46vh] space-y-1.5 overflow-y-auto">
              {roster.length === 0 && (
                <EmptyState
                  icon={<Users className="h-8 w-8" />}
                  title="Sin jugadores"
                  message="Asigna jugadores a esta categoría primero."
                />
              )}
              {roster.map((p) => {
                const inField = assignedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/player-id', p.id)}
                    onClick={() => setSelectedPlayer(selectedPlayer === p.id ? null : p.id)}
                    disabled={inField}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition-all',
                      inField
                        ? 'border-transparent bg-zinc-50 opacity-40 dark:bg-zinc-800/50'
                        : selectedPlayer === p.id
                          ? 'border-gold-500 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-zinc-200 hover:border-brand-400 dark:border-zinc-700',
                    )}
                  >
                    <Avatar src={p.photo} name={fullName(p)} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium">{fullName(p)}</span>
                    <span className="text-[10px] text-zinc-400">
                      {p.jerseyNumber != null ? `#${p.jerseyNumber}` : ''} {p.position ?? ''}
                    </span>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Alineaciones guardadas"
              action={<Badge tone="green">{lineups?.length ?? 0}</Badge>}
            />
            <CardBody className="space-y-1.5">
              {(lineups ?? []).length === 0 ? (
                <p className="py-3 text-center text-xs text-zinc-400">
                  Guarda tu primer esquema con el botón "Crear alineación".
                </p>
              ) : (
                (lineups ?? []).map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                      lineup?.id === l.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-zinc-200 dark:border-zinc-700',
                    )}
                  >
                    <Goal className="h-4 w-4 shrink-0 text-brand-600" />
                    <button
                      onClick={() => loadLineup(l)}
                      className="min-w-0 flex-1 truncate text-left font-medium"
                    >
                      {l.name}
                    </button>
                    <Badge tone="outline">{l.formation}</Badge>
                    <button
                      onClick={() => removeLineup(l)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
