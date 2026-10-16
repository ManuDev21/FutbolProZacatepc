import { useRef, useState } from 'react';
import {
  Crosshair,
  Plus,
  Copy,
  Trash2,
  Pencil,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { CaorSubnav } from '@/components/caor/CaorSubnav';
import { useCaorRivals, useCategories } from '@/hooks/useData';
import { caorRivalsService } from '@/services/caor.service';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { clamp, formatDate, todayISO, uuid } from '@/lib/utils';
import type { CaorRivalKeyPlayer, CaorRivalReport, CaorRivalSlot, SportFormat } from '@/types';

function makeDefaultRivalSlots(format: SportFormat): CaorRivalSlot[] {
  if (format === 7) {
    return [
      { id: uuid(), number: 1, label: 'POR', x: 0.5, y: 0.1 },
      { id: uuid(), number: 4, label: 'DFI', x: 0.28, y: 0.28 },
      { id: uuid(), number: 5, label: 'DFD', x: 0.72, y: 0.28 },
      { id: uuid(), number: 6, label: 'MC', x: 0.5, y: 0.5 },
      { id: uuid(), number: 7, label: 'ED', x: 0.2, y: 0.65 },
      { id: uuid(), number: 11, label: 'EI', x: 0.8, y: 0.65 },
      { id: uuid(), number: 9, label: 'DC', x: 0.5, y: 0.82 },
    ];
  }
  return [
    { id: uuid(), number: 1, label: 'POR', x: 0.5, y: 0.08 },
    { id: uuid(), number: 2, label: 'LD', x: 0.18, y: 0.25 },
    { id: uuid(), number: 4, label: 'DFC', x: 0.38, y: 0.23 },
    { id: uuid(), number: 5, label: 'DFC', x: 0.62, y: 0.23 },
    { id: uuid(), number: 3, label: 'LI', x: 0.82, y: 0.25 },
    { id: uuid(), number: 6, label: 'MCD', x: 0.5, y: 0.43 },
    { id: uuid(), number: 8, label: 'MC', x: 0.32, y: 0.55 },
    { id: uuid(), number: 10, label: 'MCO', x: 0.68, y: 0.55 },
    { id: uuid(), number: 7, label: 'ED', x: 0.2, y: 0.76 },
    { id: uuid(), number: 9, label: 'DC', x: 0.5, y: 0.84 },
    { id: uuid(), number: 11, label: 'EI', x: 0.8, y: 0.76 },
  ];
}

export default function CaorRivalPage() {
  const rivals = useCaorRivals();
  const categories = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaorRivalReport | null>(null);
  const [selectedRival, setSelectedRival] = useState<CaorRivalReport | null>(null);

  // Campos del formulario de Scouting
  const [rivalName, setRivalName] = useState('');
  const [matchDate, setMatchDate] = useState(todayISO());
  const [competition, setCompetition] = useState('Liga Estatal Morelos');
  const [categoryId, setCategoryId] = useState('');
  const [format, setFormat] = useState<SportFormat>(11);
  const [formationOffense, setFormationOffense] = useState('1-4-3-3');
  const [formationDefense, setFormationDefense] = useState('1-4-4-2 bloque medio');
  const [playingStyle, setPlayingStyle] = useState(
    'Juego directo a extremos rápidos y presión alta los primeros 15 minutos.',
  );
  const [strengthsText, setStrengthsText] = useState(
    'Transición rápida por banda derecha, Balón parado aéreo, Presión tras pérdida',
  );
  const [weaknessesText, setWeaknessesText] = useState(
    'Espacio a la espalda de los laterales, Salida de balón bajo presión al portero',
  );
  const [attackingPatterns, setAttackingPatterns] = useState(
    'Buscan saltar líneas hacia el #9 para descargar de cara y lanzar al extremo #7.',
  );
  const [defensiveTransition, setDefensiveTransition] = useState(
    'Repliegue lento de los interiores cuando pierden en zona 2.',
  );
  const [setPiecesInfo, setSetPiecesInfo] = useState(
    'Córners cerrados al primer poste buscando al central #4. Defensa zonal mixta.',
  );
  const [gamePlan, setGamePlan] = useState(
    'Presionar su primer pase, orientar hacia banda izquierda rival y atacar espalda de su lateral #2.',
  );
  const [keyPlayers, setKeyPlayers] = useState<CaorRivalKeyPlayer[]>([
    {
      id: uuid(),
      jerseyNumber: 10,
      name: 'Creativo / Media punta',
      position: 'MCO',
      threatLevel: 5,
      notes: 'Zurdo, excelente golpeo de media distancia. No dejar girar.',
    },
    {
      id: uuid(),
      jerseyNumber: 9,
      name: 'Delantero referencia',
      position: 'DC',
      threatLevel: 4,
      notes: 'Fuerte en juego aéreo y espaldas al arco.',
    },
  ]);
  const [lineupSlots, setLineupSlots] = useState<CaorRivalSlot[]>(() => makeDefaultRivalSlots(11));

  const pitchRef = useRef<HTMLDivElement>(null);
  const draggingSlotId = useRef<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setRivalName('');
    setMatchDate(todayISO());
    setCompetition('Liga Estatal');
    setCategoryId(categories?.[0]?.id ?? '');
    setFormat(11);
    setFormationOffense('1-4-3-3');
    setFormationDefense('1-4-4-2');
    setPlayingStyle('Juego directo por bandas y bloque medio-alto.');
    setStrengthsText('Transición rápida, Juego aéreo ofensivo');
    setWeaknessesText('Espalda de laterales, Salida bajo presión');
    setAttackingPatterns('Juego directo al 9 y segunda jugada.');
    setDefensiveTransition('Sufren en cambios de orientación rápidos.');
    setSetPiecesInfo('Córners al primer palo.');
    setGamePlan('Presionar salida y aprovechar amplitud.');
    setKeyPlayers([
      {
        id: uuid(),
        jerseyNumber: 10,
        name: 'Jugador franquicia',
        position: 'MCO',
        threatLevel: 5,
        notes: 'Evitar que reciba entre líneas.',
      },
    ]);
    setLineupSlots(makeDefaultRivalSlots(11));
    setModalOpen(true);
  };

  const openEdit = (r: CaorRivalReport) => {
    setEditing(r);
    setRivalName(r.rivalName);
    setMatchDate(r.matchDate ?? todayISO());
    setCompetition(r.competition ?? '');
    setCategoryId(r.categoryId ?? '');
    setFormat(r.format);
    setFormationOffense(r.formationOffense);
    setFormationDefense(r.formationDefense);
    setPlayingStyle(r.playingStyle);
    setStrengthsText(r.strengths.join(', '));
    setWeaknessesText(r.weaknesses.join(', '));
    setAttackingPatterns(r.attackingPatterns ?? '');
    setDefensiveTransition(r.defensiveTransition ?? '');
    setSetPiecesInfo(r.setPiecesInfo ?? '');
    setGamePlan(r.gamePlan ?? '');
    setKeyPlayers(r.keyPlayers.map((k) => ({ ...k })));
    setLineupSlots(r.lineupSlots.length > 0 ? r.lineupSlots.map((s) => ({ ...s })) : makeDefaultRivalSlots(r.format));
    setModalOpen(true);
  };

  const handleSlotMove = (e: React.PointerEvent, id: string) => {
    if (draggingSlotId.current !== id) return;
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp((e.clientX - rect.left) / rect.width, 0.06, 0.94);
    const y = clamp((e.clientY - rect.top) / rect.height, 0.06, 0.94);
    setLineupSlots((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  };

  const addKeyPlayer = () => {
    setKeyPlayers((prev) => [
      ...prev,
      { id: uuid(), jerseyNumber: 7, name: 'Extremo', position: 'ED', threatLevel: 4, notes: '' },
    ]);
  };

  const saveRival = async () => {
    if (!rivalName.trim()) {
      toast.warning('Escribe el nombre del equipo rival');
      return;
    }
    const payload: Omit<CaorRivalReport, 'id' | 'createdAt' | 'updatedAt'> = {
      rivalName: rivalName.trim(),
      matchDate: matchDate || undefined,
      competition: competition.trim() || undefined,
      categoryId: categoryId || undefined,
      format,
      formationOffense,
      formationDefense,
      playingStyle,
      strengths: strengthsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      weaknesses: weaknessesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      attackingPatterns,
      defensiveTransition,
      setPiecesInfo,
      gamePlan,
      keyPlayers,
      lineupSlots,
    };

    if (editing) {
      const updated = await caorRivalsService.update(editing.id, payload);
      if (updated) setSelectedRival(updated);
      toast.success('Análisis del rival actualizado');
    } else {
      const created = await caorRivalsService.create(payload);
      setSelectedRival(created);
      toast.success('Informe de rival creado');
    }
    setModalOpen(false);
  };

  const removeRival = async (r: CaorRivalReport) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar análisis de rival',
        message: `¿Eliminar el informe de "${r.rivalName}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await caorRivalsService.remove(r.id);
    if (selectedRival?.id === r.id) setSelectedRival(null);
    toast.success('Informe eliminado');
  };

  const active = selectedRival ?? rivals?.[0] ?? null;

  return (
    <div>
      <CaorSubnav />

      <PageHeader
        title="Análisis del Rival (Scouting CAOR)"
        subtitle="Estudia sistemas, fortalezas, vulnerabilidades, balón parado y jugadores amenaza del rival"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Nuevo análisis de rival
          </Button>
        }
      />

      {!rivals || rivals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Crosshair className="h-10 w-10" />}
            title="Sin informes de rivales"
            message="Registra el primer scouting de tu próximo rival con su parado táctico interactivo y plan de partido."
            action={
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4" /> Crear primer informe
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* Lista lateral de rivales */}
          <Card className="h-fit">
            <CardHeader title="Rivales analizados" subtitle={`${rivals.length} informe(s)`} />
            <CardBody className="space-y-2">
              {rivals.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRival(r)}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    active?.id === r.id
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/30'
                      : 'border-zinc-200 hover:border-brand-400 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{r.rivalName}</p>
                    <Badge tone="red">F{r.format}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {r.formationOffense} · {r.matchDate ? formatDate(r.matchDate) : ''}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Vista detallada del rival activo */}
          {active && (
            <div className="space-y-4">
              <Card>
                <CardHeader
                  title={`Scouting: ${active.rivalName}`}
                  subtitle={`${active.competition ?? 'Partido'} ${active.matchDate ? `· ${formatDate(active.matchDate)}` : ''} · Ofensivo ${active.formationOffense} / Defensivo ${active.formationDefense}`}
                  action={
                    <div className="flex gap-1.5">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(active)}>
                        <Pencil className="h-4 w-4" /> Editar informe
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await caorRivalsService.duplicate(active.id);
                          toast.success('Informe duplicado');
                        }}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeRival(active)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  }
                />
                <CardBody className="grid gap-4 lg:grid-cols-[320px_1fr]">
                  {/* Pizarra del parado rival */}
                  <div>
                    <p className="mb-2 text-xs font-bold text-zinc-500 uppercase">
                      Estructura detectada ({active.formationOffense})
                    </p>
                    <div
                      className="relative mx-auto aspect-3/4 w-full max-w-xs overflow-hidden rounded-xl border border-zinc-200 shadow-inner"
                      style={{
                        background: 'repeating-linear-gradient(0deg, #177541 0 10%, #126534 10% 20%)',
                      }}
                    >
                      <svg viewBox="0 0 100 130" className="pointer-events-none absolute inset-0 h-full w-full">
                        <g stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" fill="none">
                          <rect x="4" y="4" width="92" height="122" />
                          <line x1="4" y1="65" x2="96" y2="65" />
                          <circle cx="50" cy="65" r="12" />
                          <rect x="24" y="4" width="52" height="18" />
                          <rect x="24" y="108" width="52" height="18" />
                        </g>
                      </svg>
                      {active.lineupSlots.map((s) => (
                        <div
                          key={s.id}
                          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-600 text-xs font-black text-white shadow">
                            {s.number}
                          </div>
                          <span className="mt-0.5 rounded bg-black/65 px-1 text-[9px] font-bold text-white">
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detalles tácticos */}
                  <div className="space-y-3">
                    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      <p className="text-xs font-bold text-zinc-500 uppercase">Estilo de juego general</p>
                      <p className="mt-1 text-sm font-medium">{active.playingStyle}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <p className="text-xs font-extrabold text-emerald-700 uppercase dark:text-emerald-400">
                          Fortalezas del rival
                        </p>
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs">
                          {active.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <p className="text-xs font-extrabold text-amber-700 uppercase dark:text-amber-400">
                          Debilidades a explotar
                        </p>
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs">
                          {active.weaknesses.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                        <p className="font-bold text-zinc-500 uppercase">Patrones de ataque</p>
                        <p className="mt-1">{active.attackingPatterns || '—'}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                        <p className="font-bold text-zinc-500 uppercase">Transición defensiva</p>
                        <p className="mt-1">{active.defensiveTransition || '—'}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                        <p className="font-bold text-zinc-500 uppercase">Balón parado (ABP)</p>
                        <p className="mt-1">{active.setPiecesInfo || '—'}</p>
                      </div>
                      <div className="rounded-xl border border-brand-300 bg-brand-50/50 p-3 text-xs dark:border-brand-900 dark:bg-brand-950/30">
                        <p className="font-extrabold text-brand-700 uppercase dark:text-brand-300">
                          Nuestro Plan de Partido Cañeros
                        </p>
                        <p className="mt-1 font-medium">{active.gamePlan || '—'}</p>
                      </div>
                    </div>

                    {/* Jugadores clave */}
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase">
                        <ShieldAlert className="h-4 w-4 text-red-500" /> Jugadores clave a vigilar
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {active.keyPlayers.map((kp) => (
                          <div
                            key={kp.id}
                            className="flex items-start gap-2.5 rounded-xl border border-zinc-200 p-2.5 text-xs dark:border-zinc-800"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 font-black text-white">
                              #{kp.jerseyNumber}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  {kp.name} ({kp.position})
                                </span>
                                <span className="flex text-gold-500">
                                  {Array.from({ length: kp.threatLevel }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-gold-500" />
                                  ))}
                                </span>
                              </div>
                              <p className="mt-0.5 text-zinc-500">{kp.notes}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Modal crear / editar scouting */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Análisis del Rival' : 'Nuevo Análisis del Rival'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRival}>Guardar informe</Button>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Cancha interactiva para acomodar fichas del rival */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Arrastra fichas rivales</span>
              <Select
                value={String(format)}
                onChange={(e) => {
                  const f = Number(e.target.value) as SportFormat;
                  setFormat(f);
                  setLineupSlots(makeDefaultRivalSlots(f));
                }}
                className="w-28 py-1 text-xs"
              >
                <option value="11">Fútbol 11</option>
                <option value="7">Fútbol 7</option>
              </Select>
            </div>
            <div
              ref={pitchRef}
              className="relative mx-auto aspect-3/4 w-full touch-none select-none overflow-hidden rounded-xl border"
              style={{
                background: 'repeating-linear-gradient(0deg, #177541 0 10%, #126534 10% 20%)',
              }}
            >
              {lineupSlots.map((s) => (
                <div
                  key={s.id}
                  onPointerDown={(e) => {
                    draggingSlotId.current = s.id;
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => handleSlotMove(e, s.id)}
                  onPointerUp={() => {
                    draggingSlotId.current = null;
                  }}
                  style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex cursor-grab flex-col items-center active:cursor-grabbing"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-600 text-xs font-black text-white shadow">
                    {s.number}
                  </div>
                  <span className="mt-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Nombre del Rival" required className="sm:col-span-2">
                <Input
                  value={rivalName}
                  onChange={(e) => setRivalName(e.target.value)}
                  placeholder="Ej. Académicos Cuernavaca"
                />
              </Field>
              <Field label="Fecha del partido">
                <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
              </Field>
              <Field label="Torneo / Jornada">
                <Input value={competition} onChange={(e) => setCompetition(e.target.value)} />
              </Field>
              <Field label="Sistema ofensivo">
                <Input value={formationOffense} onChange={(e) => setFormationOffense(e.target.value)} />
              </Field>
              <Field label="Sistema defensivo">
                <Input value={formationDefense} onChange={(e) => setFormationDefense(e.target.value)} />
              </Field>
            </div>

            <Field label="Estilo de juego general">
              <Input value={playingStyle} onChange={(e) => setPlayingStyle(e.target.value)} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fortalezas (separadas por coma)">
                <Input value={strengthsText} onChange={(e) => setStrengthsText(e.target.value)} />
              </Field>
              <Field label="Debilidades (separadas por coma)">
                <Input value={weaknessesText} onChange={(e) => setWeaknessesText(e.target.value)} />
              </Field>
              <Field label="Patrones de ataque">
                <Textarea rows={2} value={attackingPatterns} onChange={(e) => setAttackingPatterns(e.target.value)} />
              </Field>
              <Field label="Transición defensiva">
                <Textarea
                  rows={2}
                  value={defensiveTransition}
                  onChange={(e) => setDefensiveTransition(e.target.value)}
                />
              </Field>
              <Field label="Balón parado (Córners / Faltas)">
                <Textarea rows={2} value={setPiecesInfo} onChange={(e) => setSetPiecesInfo(e.target.value)} />
              </Field>
              <Field label="Plan de partido Cañeros">
                <Textarea rows={2} value={gamePlan} onChange={(e) => setGamePlan(e.target.value)} />
              </Field>
            </div>

            {/* Jugadores clave */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase">Jugadores clave rivales</span>
                <Button type="button" variant="secondary" size="sm" onClick={addKeyPlayer}>
                  <Plus className="h-3.5 w-3.5" /> Añadir jugador clave
                </Button>
              </div>
              <div className="space-y-2">
                {keyPlayers.map((kp, idx) => (
                  <div key={kp.id} className="grid gap-2 sm:grid-cols-[65px_1fr_80px_90px_1fr_auto]">
                    <Input
                      type="number"
                      value={kp.jerseyNumber}
                      onChange={(e) =>
                        setKeyPlayers((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, jerseyNumber: Number(e.target.value) } : x)),
                        )
                      }
                      placeholder="#"
                    />
                    <Input
                      value={kp.name}
                      onChange={(e) =>
                        setKeyPlayers((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder="Nombre / Apodo"
                    />
                    <Input
                      value={kp.position}
                      onChange={(e) =>
                        setKeyPlayers((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, position: e.target.value } : x)),
                        )
                      }
                      placeholder="Pos"
                    />
                    <Select
                      value={String(kp.threatLevel)}
                      onChange={(e) =>
                        setKeyPlayers((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, threatLevel: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }
                              : x,
                          ),
                        )
                      }
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {'★'.repeat(n)}
                        </option>
                      ))}
                    </Select>
                    <Input
                      value={kp.notes}
                      onChange={(e) =>
                        setKeyPlayers((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, notes: e.target.value } : x)),
                        )
                      }
                      placeholder="Nota de marcaje..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setKeyPlayers((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
