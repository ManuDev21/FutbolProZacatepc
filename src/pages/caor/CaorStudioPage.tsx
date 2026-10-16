import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  Plus,
  Copy,
  Trash2,
  Save,
  Video,
  Repeat,
  RotateCcw,
  BookPlus,
  Move,
  ArrowUpRight,
  FolderOpen,
  User,
  Shield,
  CircleDot,
  Triangle,
  SquareDashed,
  Sliders,
  FileText,
  X,
} from 'lucide-react';
import { CaorSubnav } from '@/components/caor/CaorSubnav';
import { useCaorPlays, useCategories, usePlayers } from '@/hooks/useData';
import { caorPlaysService } from '@/services/caor.service';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/misc';
import { toast } from '@/stores/toast';
import { clamp, cn, fullName, uuid } from '@/lib/utils';
import type {
  CaorCanvasElement,
  CaorDrawingArrow,
  CaorElementKind,
  CaorKeyframe,
  CaorPitchType,
  CaorPlay,
} from '@/types';

interface PaletteItem {
  kind: CaorElementKind;
  name: string;
  defaultLabel: string;
  defaultColor: string;
}

const PALETTE: PaletteItem[] = [
  { kind: 'player_own', name: 'Jugador', defaultLabel: '10', defaultColor: '#177541' },
  { kind: 'player_rival', name: 'Rival', defaultLabel: 'R', defaultColor: '#dc2626' },
  { kind: 'goalkeeper', name: 'Portero', defaultLabel: '1', defaultColor: '#0284c7' },
  { kind: 'coach', name: 'Entrenador', defaultLabel: 'DT', defaultColor: '#475569' },
  { kind: 'ball', name: 'Balón', defaultLabel: 'B', defaultColor: '#ffffff' },
  { kind: 'cone', name: 'Cono', defaultLabel: 'C', defaultColor: '#ea580c' },
  { kind: 'hurdle', name: 'Valla', defaultLabel: 'VALLA', defaultColor: '#eab308' },
  { kind: 'ladder', name: 'Escalera', defaultLabel: 'ESC', defaultColor: '#0ea5e9' },
  { kind: 'mannequin', name: 'Barrera', defaultLabel: 'BAR', defaultColor: '#64748b' },
  { kind: 'minigoal', name: 'Mini arco', defaultLabel: 'ARCO', defaultColor: '#334155' },
  { kind: 'zone', name: 'Zona', defaultLabel: 'ZONA', defaultColor: '#16a34a' },
];

const INITIAL_ELEMENTS: CaorCanvasElement[] = [
  { id: 'gk-1', kind: 'goalkeeper', label: '1', color: '#0284c7', x: 0.1, y: 0.5 },
  { id: 'own-4', kind: 'player_own', label: '4', color: '#177541', x: 0.25, y: 0.32 },
  { id: 'own-5', kind: 'player_own', label: '5', color: '#177541', x: 0.25, y: 0.68 },
  { id: 'own-6', kind: 'player_own', label: '6', color: '#177541', x: 0.44, y: 0.5 },
  { id: 'own-8', kind: 'player_own', label: '8', color: '#177541', x: 0.62, y: 0.28 },
  { id: 'own-10', kind: 'player_own', label: '10', color: '#177541', x: 0.62, y: 0.72 },
  { id: 'own-9', kind: 'player_own', label: '9', color: '#177541', x: 0.8, y: 0.5 },
  { id: 'riv-1', kind: 'player_rival', label: 'R1', color: '#dc2626', x: 0.55, y: 0.42 },
  { id: 'riv-2', kind: 'player_rival', label: 'R2', color: '#dc2626', x: 0.72, y: 0.52 },
  { id: 'ball-1', kind: 'ball', label: 'B', color: '#ffffff', x: 0.47, y: 0.48 },
];

function snapshotPositions(elements: CaorCanvasElement[]): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {};
  for (const el of elements) {
    out[el.id] = { x: el.x, y: el.y };
  }
  return out;
}

function makeDefaultKeyframes(elements: CaorCanvasElement[]): CaorKeyframe[] {
  const pos1 = snapshotPositions(elements);
  const pos2: Record<string, { x: number; y: number }> = {};
  for (const el of elements) {
    if (el.id === 'own-6') pos2[el.id] = { x: 0.52, y: 0.45 };
    else if (el.id === 'own-8') pos2[el.id] = { x: 0.74, y: 0.24 };
    else if (el.id === 'own-9') pos2[el.id] = { x: 0.86, y: 0.46 };
    else if (el.id === 'ball-1') pos2[el.id] = { x: 0.74, y: 0.26 };
    else pos2[el.id] = { x: el.x, y: el.y };
  }
  const pos3: Record<string, { x: number; y: number }> = {};
  for (const el of elements) {
    if (el.id === 'own-9') pos3[el.id] = { x: 0.88, y: 0.5 };
    else if (el.id === 'own-10') pos3[el.id] = { x: 0.78, y: 0.64 };
    else if (el.id === 'ball-1') pos3[el.id] = { x: 0.91, y: 0.5 };
    else pos3[el.id] = pos2[el.id] ?? { x: el.x, y: el.y };
  }
  return [
    { id: 'kf-1', name: 'Paso 1 · Inicio', durationMs: 1400, positions: pos1, arrows: [] },
    { id: 'kf-2', name: 'Paso 2 · Ruptura exterior', durationMs: 1400, positions: pos2, arrows: [] },
    { id: 'kf-3', name: 'Paso 3 · Definición', durationMs: 1400, positions: pos3, arrows: [] },
  ];
}

/** Icono vectorial limpio de balón de fútbol (sin emojis). */
function BallSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-900" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" fill="#ffffff" />
      <polygon points="12,7.5 15,9.7 13.8,13.3 10.2,13.3 9,9.7" fill="currentColor" />
      <line x1="12" y1="3" x2="12" y2="7.5" />
      <line x1="15" y1="9.7" x2="20" y2="8.5" />
      <line x1="13.8" y1="13.3" x2="17.5" y2="18.2" />
      <line x1="10.2" y1="13.3" x2="6.5" y2="18.2" />
      <line x1="9" y1="9.7" x2="4" y2="8.5" />
    </svg>
  );
}

export default function CaorStudioPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plays = useCaorPlays();
  const categories = useCategories();
  const players = usePlayers();

  const [currentPlayId, setCurrentPlayId] = useState<string | null>(null);
  const [title, setTitle] = useState('Salida limpia y ruptura por banda');
  const [kind, setKind] = useState<CaorPlay['kind']>('jugada');
  const [folder, setFolder] = useState('Automatismos Ofensivos');
  const [categoryId, setCategoryId] = useState('');
  const [pitchType, setPitchType] = useState<CaorPitchType>('f11');
  const [objective, setObjective] = useState('Progresión desde zona 1 con tercer hombre y finalización.');
  const [description, setDescription] = useState(
    'El mediocentro recibe perfilado, descarga a banda para la ruptura del interior y centro al área.',
  );
  const [durationMin, setDurationMin] = useState(20);
  const [intensity, setIntensity] = useState<NonNullable<CaorPlay['intensity']>>('alta');
  const [tagsText, setTagsText] = useState('tactica, posesion, finalizacion');

  const [elements, setElements] = useState<CaorCanvasElement[]>(INITIAL_ELEMENTS);
  const [keyframes, setKeyframes] = useState<CaorKeyframe[]>(() => makeDefaultKeyframes(INITIAL_ELEMENTS));
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>('own-10');

  // Pestaña activa del panel lateral para evitar saturación de formularios
  const [inspectorTab, setInspectorTab] = useState<'element' | 'metadata'>('element');

  // Modos de interacción y flechas
  const [toolMode, setToolMode] = useState<'move' | 'arrow_pass' | 'arrow_run' | 'arrow_shoot'>('move');
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);

  // Grabación y reproducción
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 1.5 | 2>(1);
  const [showTrails, setShowTrails] = useState(true);
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [animPositions, setAnimPositions] = useState<Record<string, { x: number; y: number }> | null>(null);
  const [playProgress, setPlayProgress] = useState(0);

  const pitchRef = useRef<HTMLDivElement>(null);
  const draggingIdRef = useRef<string | null>(null);
  const liveRecTimerRef = useRef<number | null>(null);

  const requestedId = params.get('id');
  useEffect(() => {
    if (!requestedId || !plays) return;
    const found = plays.find((p) => p.id === requestedId);
    if (found && found.id !== currentPlayId) {
      loadPlayIntoStudio(found);
    }
  }, [requestedId, plays]);

  const loadPlayIntoStudio = (p: CaorPlay) => {
    setIsPlaying(false);
    setAnimPositions(null);
    setCurrentPlayId(p.id);
    setTitle(p.title);
    setKind(p.kind);
    setFolder(p.folder);
    setCategoryId(p.categoryId ?? '');
    setPitchType(p.pitchType);
    setObjective(p.objective ?? '');
    setDescription(p.description ?? '');
    setDurationMin(p.durationMin ?? 20);
    setIntensity(p.intensity ?? 'media');
    setTagsText(p.tags.join(', '));
    const firstFrame = p.keyframes[0];
    const hydrated = p.elements.map((el) => ({
      ...el,
      x: clamp(firstFrame?.positions[el.id]?.x ?? el.x, 0.07, 0.93),
      y: clamp(firstFrame?.positions[el.id]?.y ?? el.y, 0.08, 0.92),
    }));
    setElements(hydrated);
    setKeyframes(
      p.keyframes.length > 0
        ? p.keyframes.map((k) => ({ ...k, positions: { ...k.positions }, arrows: k.arrows ?? [] }))
        : [
            {
              id: uuid(),
              name: 'Paso 1 · Inicio',
              durationMs: 1400,
              positions: snapshotPositions(hydrated),
              arrows: [],
            },
          ],
    );
    setActiveFrameIdx(0);
    setSelectedId(hydrated[0]?.id ?? null);
  };

  const selectKeyframe = (idx: number) => {
    if (idx < 0 || idx >= keyframes.length) return;
    setIsPlaying(false);
    setAnimPositions(null);
    setActiveFrameIdx(idx);
    const kf = keyframes[idx];
    if (!kf) return;
    setElements((prev) =>
      prev.map((el) => ({
        ...el,
        x: kf.positions[el.id]?.x ?? el.x,
        y: kf.positions[el.id]?.y ?? el.y,
      })),
    );
  };

  useEffect(() => {
    if (!isPlaying) {
      setAnimPositions(null);
      return;
    }
    if (keyframes.length < 2) {
      toast.info('Agrega al menos 2 pasos para reproducir la animación');
      setIsPlaying(false);
      return;
    }

    let rafId = 0;
    const segments = keyframes.length - 1;
    const segDurations = keyframes
      .slice(0, segments)
      .map((k) => Math.max(300, (k.durationMs || 1400) / speed));
    const totalMs = segDurations.reduce((a, b) => a + b, 0);
    let startTime = performance.now();

    const tick = (now: number) => {
      let elapsed = now - startTime;
      if (elapsed >= totalMs) {
        if (loop) {
          startTime = now;
          elapsed = 0;
        } else {
          const last = keyframes[keyframes.length - 1];
          setAnimPositions(last.positions);
          setActiveFrameIdx(keyframes.length - 1);
          setPlayProgress(1);
          setIsPlaying(false);
          return;
        }
      }

      setPlayProgress(totalMs > 0 ? elapsed / totalMs : 0);

      let acc = 0;
      let segIdx = 0;
      for (let i = 0; i < segments; i++) {
        if (elapsed <= acc + segDurations[i]) {
          segIdx = i;
          break;
        }
        acc += segDurations[i];
      }
      const localT = clamp((elapsed - acc) / segDurations[segIdx], 0, 1);
      const eased = localT < 0.5 ? 4 * localT * localT * localT : 1 - Math.pow(-2 * localT + 2, 3) / 2;

      const fromPos = keyframes[segIdx].positions;
      const toPos = keyframes[segIdx + 1].positions;
      const interp: Record<string, { x: number; y: number }> = {};
      for (const el of elements) {
        const a = fromPos[el.id] ?? { x: el.x, y: el.y };
        const b = toPos[el.id] ?? a;
        interp[el.id] = {
          x: a.x + (b.x - a.x) * eased,
          y: a.y + (b.y - a.y) * eased,
        };
      }
      setActiveFrameIdx(segIdx);
      setAnimPositions(interp);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, keyframes, elements, loop, speed]);

  useEffect(() => {
    if (!isLiveRecording) {
      if (liveRecTimerRef.current) window.clearInterval(liveRecTimerRef.current);
      liveRecTimerRef.current = null;
      return;
    }
    liveRecTimerRef.current = window.setInterval(() => {
      if (!draggingIdRef.current) return;
      setElements((currentEls) => {
        const snap = snapshotPositions(currentEls);
        setKeyframes((prev) => {
          const nextNum = prev.length + 1;
          const next: CaorKeyframe = {
            id: uuid(),
            name: `Paso ${nextNum}`,
            durationMs: 700,
            positions: snap,
            arrows: [],
          };
          const updated = [...prev, next];
          setActiveFrameIdx(updated.length - 1);
          return updated;
        });
        return currentEls;
      });
    }, 650);
    return () => {
      if (liveRecTimerRef.current) window.clearInterval(liveRecTimerRef.current);
    };
  }, [isLiveRecording]);

  const getCoords = (clientX: number, clientY: number) => {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0.5, y: 0.5 };
    return {
      x: clamp((clientX - rect.left) / rect.width, 0.06, 0.94),
      y: clamp((clientY - rect.top) / rect.height, 0.08, 0.92),
    };
  };

  const updateElementPosition = (id: string, x: number, y: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x, y } : el)));
    setKeyframes((prev) =>
      prev.map((kf, idx) =>
        idx === activeFrameIdx
          ? { ...kf, positions: { ...kf.positions, [id]: { x, y } } }
          : kf,
      ),
    );
  };

  const handlePointerDownElement = (e: React.PointerEvent, id: string) => {
    if (toolMode !== 'move') return;
    e.stopPropagation();
    setIsPlaying(false);
    setSelectedId(id);
    draggingIdRef.current = id;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveElement = (e: React.PointerEvent, id: string) => {
    if (draggingIdRef.current !== id) return;
    const { x, y } = getCoords(e.clientX, e.clientY);
    updateElementPosition(id, x, y);
  };

  const handlePointerUpElement = () => {
    draggingIdRef.current = null;
  };

  const handlePitchPointerDown = (e: React.PointerEvent) => {
    if (toolMode === 'move') return;
    const coords = getCoords(e.clientX, e.clientY);
    setDrawingStart(coords);
  };

  const handlePitchPointerUp = (e: React.PointerEvent) => {
    if (toolMode === 'move' || !drawingStart) return;
    const end = getCoords(e.clientX, e.clientY);
    const dist = Math.hypot(end.x - drawingStart.x, end.y - drawingStart.y);
    if (dist > 0.03) {
      const kindMap = {
        arrow_pass: { kind: 'pass' as const, color: '#ffffff' },
        arrow_run: { kind: 'run' as const, color: '#cbd5e1' },
        arrow_shoot: { kind: 'shoot' as const, color: '#ef4444' },
      };
      const cfg = kindMap[toolMode];
      const arrow: CaorDrawingArrow = {
        id: uuid(),
        kind: cfg.kind,
        fromX: drawingStart.x,
        fromY: drawingStart.y,
        toX: end.x,
        toY: end.y,
        color: cfg.color,
      };
      setKeyframes((prev) =>
        prev.map((kf, i) =>
          i === activeFrameIdx ? { ...kf, arrows: [...(kf.arrows ?? []), arrow] } : kf,
        ),
      );
    }
    setDrawingStart(null);
  };

  const addElement = (item: PaletteItem) => {
    const sameKindCount = elements.filter((e) => e.kind === item.kind).length;
    const label =
      item.kind === 'player_own'
        ? String(sameKindCount + 2)
        : item.kind === 'player_rival'
          ? `R${sameKindCount + 1}`
          : item.defaultLabel;
    const newEl: CaorCanvasElement = {
      id: uuid(),
      kind: item.kind,
      label,
      color: item.defaultColor,
      x: clamp(0.35 + (sameKindCount % 5) * 0.07, 0.12, 0.88),
      y: clamp(0.3 + (sameKindCount % 4) * 0.12, 0.14, 0.86),
      size: 1,
      width: item.kind === 'zone' ? 0.22 : undefined,
      height: item.kind === 'zone' ? 0.28 : undefined,
    };
    setElements((prev) => [...prev, newEl]);
    setKeyframes((prev) =>
      prev.map((kf) => ({
        ...kf,
        positions: { ...kf.positions, [newEl.id]: { x: newEl.x, y: newEl.y } },
      })),
    );
    setSelectedId(newEl.id);
    setToolMode('move');
  };

  const duplicateSelected = () => {
    const sel = elements.find((e) => e.id === selectedId);
    if (!sel) {
      toast.info('Selecciona primero un elemento en la cancha');
      return;
    }
    const numeric = Number(sel.label);
    const nextLabel = !Number.isNaN(numeric) && numeric > 0 ? String(numeric + 1) : sel.label;
    const copy: CaorCanvasElement = {
      ...sel,
      id: uuid(),
      label: nextLabel,
      x: clamp(sel.x + 0.05, 0.08, 0.92),
      y: clamp(sel.y + 0.06, 0.08, 0.92),
    };
    setElements((prev) => [...prev, copy]);
    setKeyframes((prev) =>
      prev.map((kf) => {
        const basePos = kf.positions[sel.id] ?? { x: sel.x, y: sel.y };
        return {
          ...kf,
          positions: {
            ...kf.positions,
            [copy.id]: {
              x: clamp(basePos.x + 0.05, 0.08, 0.92),
              y: clamp(basePos.y + 0.06, 0.08, 0.92),
            },
          },
        };
      }),
    );
    setSelectedId(copy.id);
    toast.success('Elemento duplicado');
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((e) => e.id !== selectedId));
    setKeyframes((prev) =>
      prev.map((kf) => {
        const nextPos = { ...kf.positions };
        delete nextPos[selectedId];
        return { ...kf, positions: nextPos };
      }),
    );
    setSelectedId(null);
  };

  const recordStep = () => {
    const snap = snapshotPositions(elements);
    const nextNum = keyframes.length + 1;
    const newKf: CaorKeyframe = {
      id: uuid(),
      name: `Paso ${nextNum}`,
      durationMs: 1400,
      positions: snap,
      arrows: [],
    };
    const next = [...keyframes, newKf];
    setKeyframes(next);
    setActiveFrameIdx(next.length - 1);
    toast.success(`Paso ${nextNum} agregado`, 'Ahora mueve las piezas en la cancha para definir su posición.');
  };

  const removeKeyframe = (idx: number) => {
    if (keyframes.length <= 1) {
      toast.warning('Debe existir al menos un paso inicial');
      return;
    }
    const next = keyframes.filter((_, i) => i !== idx);
    const nextIdx = Math.min(activeFrameIdx, next.length - 1);
    setKeyframes(next);
    selectKeyframe(nextIdx);
  };

  const clearArrowsInFrame = () => {
    setKeyframes((prev) =>
      prev.map((kf, i) => (i === activeFrameIdx ? { ...kf, arrows: [] } : kf)),
    );
  };

  const loadPresetFormation = (preset: 'rondo' | 'salida_f11' | 'ataque_f7' | 'vacio') => {
    setIsPlaying(false);
    if (preset === 'vacio') {
      const ballOnly: CaorCanvasElement[] = [
        { id: uuid(), kind: 'ball', label: 'B', color: '#ffffff', x: 0.5, y: 0.5 },
      ];
      setElements(ballOnly);
      setKeyframes([
        { id: uuid(), name: 'Paso 1 · Inicio', durationMs: 1400, positions: snapshotPositions(ballOnly), arrows: [] },
      ]);
      setActiveFrameIdx(0);
      return;
    }
    if (preset === 'rondo') {
      setPitchType('grid');
      setTitle('Rondo 4 vs 2 en espacio reducido');
      setKind('ejercicio');
      const els: CaorCanvasElement[] = [
        { id: uuid(), kind: 'zone', label: 'RONDO 12x12m', color: '#16a34a', x: 0.5, y: 0.5, width: 0.48, height: 0.56 },
        { id: uuid(), kind: 'cone', label: 'C', color: '#ea580c', x: 0.28, y: 0.24 },
        { id: uuid(), kind: 'cone', label: 'C', color: '#ea580c', x: 0.72, y: 0.24 },
        { id: uuid(), kind: 'cone', label: 'C', color: '#ea580c', x: 0.28, y: 0.76 },
        { id: uuid(), kind: 'cone', label: 'C', color: '#ea580c', x: 0.72, y: 0.76 },
        { id: uuid(), kind: 'player_own', label: '4', color: '#177541', x: 0.5, y: 0.22 },
        { id: uuid(), kind: 'player_own', label: '8', color: '#177541', x: 0.74, y: 0.5 },
        { id: uuid(), kind: 'player_own', label: '10', color: '#177541', x: 0.5, y: 0.78 },
        { id: uuid(), kind: 'player_own', label: '6', color: '#177541', x: 0.26, y: 0.5 },
        { id: uuid(), kind: 'player_rival', label: 'R1', color: '#dc2626', x: 0.45, y: 0.44 },
        { id: uuid(), kind: 'player_rival', label: 'R2', color: '#dc2626', x: 0.56, y: 0.56 },
        { id: uuid(), kind: 'ball', label: 'B', color: '#ffffff', x: 0.5, y: 0.26 },
      ];
      setElements(els);
      setKeyframes([
        { id: uuid(), name: 'Paso 1 · Inicio Rondo', durationMs: 1200, positions: snapshotPositions(els), arrows: [] },
      ]);
      setActiveFrameIdx(0);
      return;
    }
    if (preset === 'ataque_f7') {
      setPitchType('f7');
      setTitle('Estructura ofensiva 2-3-1 Fútbol 7');
      setKind('jugada');
      const els: CaorCanvasElement[] = [
        { id: uuid(), kind: 'goalkeeper', label: '1', color: '#0284c7', x: 0.1, y: 0.5 },
        { id: uuid(), kind: 'player_own', label: '2', color: '#177541', x: 0.28, y: 0.3 },
        { id: uuid(), kind: 'player_own', label: '3', color: '#177541', x: 0.28, y: 0.7 },
        { id: uuid(), kind: 'player_own', label: '6', color: '#177541', x: 0.5, y: 0.5 },
        { id: uuid(), kind: 'player_own', label: '7', color: '#177541', x: 0.58, y: 0.22 },
        { id: uuid(), kind: 'player_own', label: '11', color: '#177541', x: 0.58, y: 0.78 },
        { id: uuid(), kind: 'player_own', label: '9', color: '#177541', x: 0.8, y: 0.5 },
        { id: uuid(), kind: 'ball', label: 'B', color: '#ffffff', x: 0.52, y: 0.48 },
      ];
      setElements(els);
      setKeyframes([
        { id: uuid(), name: 'Paso 1 · Estructura 2-3-1', durationMs: 1300, positions: snapshotPositions(els), arrows: [] },
      ]);
      setActiveFrameIdx(0);
      return;
    }
    setPitchType('f11');
    setElements(INITIAL_ELEMENTS);
    setKeyframes(makeDefaultKeyframes(INITIAL_ELEMENTS));
    setActiveFrameIdx(0);
  };

  const savePlay = async (alsoExportToExercises = false) => {
    if (!title.trim()) {
      toast.warning('Escribe un título para la jugada o ejercicio');
      setInspectorTab('metadata');
      return;
    }
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const payload: Omit<CaorPlay, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      kind,
      folder: folder.trim() || 'General',
      categoryId: categoryId || undefined,
      pitchType,
      objective: objective.trim() || undefined,
      description: description.trim() || undefined,
      durationMin,
      intensity,
      tags,
      favorite: false,
      elements,
      keyframes,
    };

    let saved: CaorPlay | undefined;
    if (currentPlayId) {
      saved = await caorPlaysService.update(currentPlayId, payload);
      toast.success('Jugada actualizada', title);
    } else {
      saved = await caorPlaysService.create(payload);
      setCurrentPlayId(saved.id);
      toast.success('Guardado en Mi Biblioteca', title);
    }
    if (alsoExportToExercises && saved) {
      await caorPlaysService.exportToExerciseLibrary(saved);
      toast.success('Añadido también al catálogo general de Ejercicios');
    }
  };

  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const activeFrame = keyframes[activeFrameIdx] ?? keyframes[0];
  const currentPositions = animPositions ?? activeFrame?.positions ?? {};

  return (
    <div className="space-y-6">
      <CaorSubnav />

      <PageHeader
        title="Estudio Táctico y Ejercicios"
        subtitle="Coloca elementos en la cancha, graba cada paso de la jugada y reprodúcela en movimiento"
        actions={
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setCurrentPlayId(null);
                loadPresetFormation('salida_f11');
                toast.info('Lienzo reiniciado');
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reiniciar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => savePlay(true)}>
              <BookPlus className="h-4 w-4" /> Guardar y enviar a Ejercicios
            </Button>
            <Button size="sm" onClick={() => savePlay(false)}>
              <Save className="h-4 w-4" /> {currentPlayId ? 'Actualizar jugada' : 'Guardar en Mi Biblioteca'}
            </Button>
          </div>
        }
      />

      {/* Barra de controles limpia y espaciada */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Fila 1: Paleta para añadir elementos y acciones sobre el elemento seleccionado */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-zinc-500">Añadir:</span>
              {PALETTE.map((item) => (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => addElement(item)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-brand-500 hover:bg-brand-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {item.kind === 'ball' ? (
                    <CircleDot className="h-3.5 w-3.5 text-brand-600" />
                  ) : item.kind === 'cone' ? (
                    <Triangle className="h-3.5 w-3.5 text-orange-500" />
                  ) : item.kind === 'zone' ? (
                    <SquareDashed className="h-3.5 w-3.5 text-emerald-600" />
                  ) : item.kind === 'player_rival' ? (
                    <Shield className="h-3.5 w-3.5 text-red-600" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-brand-600" />
                  )}
                  {item.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={duplicateSelected}>
                <Copy className="h-3.5 w-3.5" /> Duplicar seleccionado
              </Button>
              {selectedElement && (
                <Button variant="danger" size="sm" onClick={removeSelected}>
                  <Trash2 className="h-3.5 w-3.5" /> Quitar
                </Button>
              )}
            </div>
          </div>

          {/* Fila 2: Herramienta de puntero/flechas y selector de cancha/plantillas */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3.5 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Herramienta:</span>
              <button
                type="button"
                onClick={() => setToolMode('move')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  toolMode === 'move'
                    ? 'bg-brand-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
                )}
              >
                <Move className="h-3.5 w-3.5" /> Mover fichas
              </button>
              <button
                type="button"
                onClick={() => setToolMode('arrow_pass')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  toolMode === 'arrow_pass'
                    ? 'bg-brand-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> Flecha de pase
              </button>
              <button
                type="button"
                onClick={() => setToolMode('arrow_run')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  toolMode === 'arrow_run'
                    ? 'bg-brand-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> Desmarque
              </button>
              <button
                type="button"
                onClick={() => setToolMode('arrow_shoot')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  toolMode === 'arrow_shoot'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> Disparo
              </button>
              {(activeFrame?.arrows?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={clearArrowsInFrame}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Borrar flechas ({activeFrame.arrows?.length})
                </button>
              )}
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <Select
                value={pitchType}
                onChange={(e) => setPitchType(e.target.value as CaorPitchType)}
                className="w-full py-1.5 text-xs sm:w-40"
              >
                <option value="f11">Cancha Fútbol 11</option>
                <option value="f7">Cancha Fútbol 7</option>
                <option value="half">Media cancha</option>
                <option value="grid">Espacio reducido</option>
              </Select>
              <Select
                value=""
                onChange={(e) => {
                  const val = e.target.value as 'salida_f11' | 'ataque_f7' | 'rondo' | 'vacio' | '';
                  if (val) loadPresetFormation(val);
                }}
                className="w-full py-1.5 text-xs sm:w-44"
              >
                <option value="">Cargar plantilla base...</option>
                <option value="salida_f11">Salida Fútbol 11</option>
                <option value="ataque_f7">Ataque 2-3-1 Fútbol 7</option>
                <option value="rondo">Rondo 4 vs 2</option>
                <option value="vacio">Cancha limpia</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Área principal con min-w-0 para evitar cualquier desborde horizontal */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Columna izquierda: Cancha estable + Controles de pasos */}
        <div className="min-w-0 space-y-5">
          <Card className="min-w-0 overflow-hidden p-3 sm:p-4">
            <div
              ref={pitchRef}
              onPointerDown={handlePitchPointerDown}
              onPointerUp={handlePitchPointerUp}
              className={cn(
                'relative mx-auto aspect-16/10 max-h-[540px] w-full touch-none select-none overflow-hidden rounded-xl',
                toolMode !== 'move' && 'cursor-crosshair',
              )}
              style={{
                background:
                  pitchType === 'grid'
                    ? 'repeating-linear-gradient(90deg, #156839 0 12.5%, #125c32 12.5% 25%)'
                    : 'repeating-linear-gradient(90deg, #177541 0 10%, #126534 10% 20%)',
              }}
            >
              <svg viewBox="0 0 160 100" className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                  <marker id="arrow-white" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#ffffff" />
                  </marker>
                  <marker id="arrow-slate" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#cbd5e1" />
                  </marker>
                  <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                  </marker>
                </defs>

                <g stroke="rgba(255,255,255,0.65)" strokeWidth="0.7" fill="none">
                  <rect x="4" y="4" width="152" height="92" rx="1" />
                  {pitchType === 'grid' ? (
                    <>
                      <line x1="42" y1="4" x2="42" y2="96" strokeDasharray="2 2" />
                      <line x1="80" y1="4" x2="80" y2="96" strokeDasharray="2 2" />
                      <line x1="118" y1="4" x2="118" y2="96" strokeDasharray="2 2" />
                      <line x1="4" y1="35" x2="156" y2="35" strokeDasharray="2 2" />
                      <line x1="4" y1="65" x2="156" y2="65" strokeDasharray="2 2" />
                    </>
                  ) : pitchType === 'half' ? (
                    <>
                      <rect x="124" y="22" width="32" height="56" />
                      <rect x="144" y="36" width="12" height="28" />
                      <circle cx="136" cy="50" r="1" fill="white" />
                      <path d="M 4 36 A 14 14 0 0 1 4 64" />
                    </>
                  ) : (
                    <>
                      <line x1="80" y1="4" x2="80" y2="96" />
                      <circle cx="80" cy="50" r="13" />
                      <circle cx="80" cy="50" r="1" fill="white" />
                      <rect x="4" y="22" width="24" height="56" />
                      <rect x="4" y="36" width="9" height="28" />
                      <rect x="132" y="22" width="24" height="56" />
                      <rect x="147" y="36" width="9" height="28" />
                    </>
                  )}
                </g>

                {showTrails &&
                  keyframes.length > 1 &&
                  elements.map((el) => {
                    const nextIdx = Math.min(activeFrameIdx + 1, keyframes.length - 1);
                    const p1 = keyframes[activeFrameIdx]?.positions[el.id];
                    const p2 = keyframes[nextIdx]?.positions[el.id];
                    if (!p1 || !p2) return null;
                    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    if (dist < 0.015) return null;
                    return (
                      <line
                        key={`trail-${el.id}`}
                        x1={p1.x * 160}
                        y1={p1.y * 100}
                        x2={p2.x * 160}
                        y2={p2.y * 100}
                        stroke={el.color}
                        strokeWidth="0.65"
                        strokeDasharray="2 1.5"
                        opacity="0.75"
                      />
                    );
                  })}

                {(activeFrame?.arrows ?? []).map((ar) => (
                  <line
                    key={ar.id}
                    x1={ar.fromX * 160}
                    y1={ar.fromY * 100}
                    x2={ar.toX * 160}
                    y2={ar.toY * 100}
                    stroke={ar.color}
                    strokeWidth={ar.kind === 'shoot' ? '1.2' : '0.9'}
                    strokeDasharray={ar.kind === 'run' ? '2.5 1.8' : undefined}
                    markerEnd={
                      ar.kind === 'shoot'
                        ? 'url(#arrow-red)'
                        : ar.kind === 'run'
                          ? 'url(#arrow-slate)'
                          : 'url(#arrow-white)'
                    }
                  />
                ))}
              </svg>

              <img
                src="/logo.svg"
                alt=""
                className="pointer-events-none absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 opacity-10"
              />

              <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
                <span className="rounded-md bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
                  {activeFrame?.name ?? 'Paso 1'} ({activeFrameIdx + 1}/{keyframes.length})
                </span>
                {isLiveRecording && (
                  <span className="inline-flex animate-pulse items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                    Grabando movimientos en vivo
                  </span>
                )}
              </div>

              {elements.map((el) => {
                const rawPos = currentPositions[el.id] ?? { x: el.x, y: el.y };
                const pos = {
                  x: clamp(rawPos.x, 0.06, 0.94),
                  y: clamp(rawPos.y, 0.08, 0.92),
                };
                const isSel = selectedId === el.id;
                const linkedPlayer = el.playerId ? players?.find((p) => p.id === el.playerId) : undefined;

                if (el.kind === 'zone') {
                  const w = (el.width ?? 0.22) * 100;
                  const h = (el.height ?? 0.28) * 100;
                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => handlePointerDownElement(e, el.id)}
                      onPointerMove={(e) => handlePointerMoveElement(e, el.id)}
                      onPointerUp={handlePointerUpElement}
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        width: `${w}%`,
                        height: `${h}%`,
                        borderColor: el.color,
                        backgroundColor: `${el.color}26`,
                      }}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 flex cursor-grab items-start justify-start rounded-xl border-2 border-dashed p-1.5 active:cursor-grabbing',
                        isSel && 'ring-2 ring-white',
                      )}
                    >
                      <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {el.label}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDownElement(e, el.id)}
                    onPointerMove={(e) => handlePointerMoveElement(e, el.id)}
                    onPointerUp={handlePointerUpElement}
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                      transform: `translate(-50%, -50%) scale(${el.size ?? 1})`,
                    }}
                    className="absolute z-10 flex cursor-grab flex-col items-center active:cursor-grabbing"
                  >
                    {el.kind === 'ball' ? (
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-black/25',
                          isSel && 'ring-4 ring-white',
                        )}
                      >
                        <BallSvg />
                      </div>
                    ) : el.kind === 'cone' ? (
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md text-white shadow',
                          isSel && 'ring-2 ring-white',
                        )}
                        style={{ backgroundColor: el.color }}
                      >
                        <Triangle className="h-3.5 w-3.5 fill-current" />
                      </div>
                    ) : el.kind === 'minigoal' || el.kind === 'hurdle' || el.kind === 'ladder' ? (
                      <div
                        className={cn(
                          'rounded border border-white/80 px-2 py-0.5 text-[10px] font-bold text-white shadow',
                          isSel && 'ring-2 ring-white',
                        )}
                        style={{ backgroundColor: el.color }}
                      >
                        {el.label}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md transition-transform sm:h-9 sm:w-9',
                          isSel && 'scale-110 ring-4 ring-white/80',
                        )}
                        style={{ backgroundColor: el.color }}
                      >
                        {el.label}
                      </div>
                    )}
                    {(el.sublabel || linkedPlayer) && (
                      <span className="mt-0.5 max-w-20 truncate rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {linkedPlayer ? linkedPlayer.firstName : el.sublabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Barra de reproducción y pasos con buen espacio */}
            <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {!isPlaying ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsLiveRecording(false);
                        setIsPlaying(true);
                      }}
                    >
                      <Play className="h-4 w-4" /> Reproducir jugada
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setIsPlaying(false)}>
                      <Pause className="h-4 w-4" /> Pausar
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsPlaying(false);
                      setPlayProgress(0);
                      selectKeyframe(0);
                    }}
                  >
                    <Square className="h-3.5 w-3.5" /> Inicio
                  </Button>
                  <Button variant="secondary" size="sm" onClick={recordStep}>
                    <Plus className="h-4 w-4" /> Grabar paso ({keyframes.length})
                  </Button>
                  <Button
                    variant={isLiveRecording ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      setIsPlaying(false);
                      setIsLiveRecording((v) => !v);
                    }}
                  >
                    <Video className="h-4 w-4" />
                    {isLiveRecording ? 'Detener grabación' : 'Grabar en vivo'}
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoop((l) => !l)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium',
                      loop
                        ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-zinc-300 text-zinc-500 dark:border-zinc-700',
                    )}
                  >
                    <Repeat className="h-3.5 w-3.5" /> Bucle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTrails((t) => !t)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 font-medium',
                      showTrails
                        ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-zinc-300 text-zinc-500 dark:border-zinc-700',
                    )}
                  >
                    Trayectorias
                  </button>
                  <Select
                    value={String(speed)}
                    onChange={(e) => setSpeed(Number(e.target.value) as 0.5 | 1 | 1.5 | 2)}
                    className="w-28 py-1.5 text-xs"
                  >
                    <option value="0.5">0.5x Lento</option>
                    <option value="1">1x Normal</option>
                    <option value="1.5">1.5x Rápido</option>
                    <option value="2">2x Doble</option>
                  </Select>
                </div>
              </div>

              {isPlaying && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full bg-brand-600 transition-all duration-75"
                    style={{ width: `${Math.round(playProgress * 100)}%` }}
                  />
                </div>
              )}

              {/* Línea de tiempo de pasos */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {keyframes.map((kf, idx) => (
                  <div
                    key={kf.id}
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition',
                      idx === activeFrameIdx
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-brand-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
                    )}
                  >
                    <button type="button" onClick={() => selectKeyframe(idx)} className="font-semibold">
                      {idx + 1}. {kf.name}
                    </button>
                    <span className="text-[10px] opacity-75">{(kf.durationMs / 1000).toFixed(1)}s</span>
                    {keyframes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKeyframe(idx)}
                        className="rounded p-0.5 opacity-70 hover:bg-black/20 hover:opacity-100"
                        title="Eliminar paso"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Jugadas guardadas recientemente */}
          <Card>
            <CardHeader
              title="Jugadas y ejercicios guardados"
              subtitle="Selecciona cualquiera para cargarlo en la pizarra"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/app/caor/biblioteca')}>
                  <FolderOpen className="h-4 w-4" /> Ver Biblioteca ({plays?.length ?? 0})
                </Button>
              }
            />
            <CardBody className="p-5">
              {!plays || plays.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Aún no has guardado jugadas. Usa el botón superior <strong>Guardar en Mi Biblioteca</strong>.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {plays.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => loadPlayIntoStudio(p)}
                      className={cn(
                        'cursor-pointer rounded-xl border p-3.5 transition hover:border-brand-500',
                        currentPlayId === p.id
                          ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30'
                          : 'border-zinc-200 dark:border-zinc-800',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone="green">{p.kind}</Badge>
                        <span className="text-xs text-zinc-400">{p.keyframes.length} pasos</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold">{p.title}</p>
                      <p className="truncate text-xs text-zinc-500">{p.folder}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Columna derecha organizada por pestañas para evitar saturación */}
        <div className="min-w-0">
          <Card>
            <div className="grid grid-cols-2 border-b border-zinc-200 p-1.5 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setInspectorTab('element')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition',
                  inspectorTab === 'element'
                    ? 'bg-brand-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                <Sliders className="h-3.5 w-3.5" /> Elemento y Paso
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('metadata')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition',
                  inspectorTab === 'metadata'
                    ? 'bg-brand-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                <FileText className="h-3.5 w-3.5" /> Datos de la Jugada
              </button>
            </div>

            {inspectorTab === 'element' ? (
              <CardBody className="space-y-6 p-5">
                {/* Edición del elemento */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Elemento seleccionado
                    </h4>
                    {selectedElement && (
                      <Button variant="secondary" size="sm" onClick={duplicateSelected}>
                        <Copy className="h-3.5 w-3.5" /> Duplicar
                      </Button>
                    )}
                  </div>

                  {!selectedElement ? (
                    <p className="rounded-xl bg-zinc-50 p-4 text-xs text-zinc-500 dark:bg-zinc-800/50">
                      Toca cualquier jugador o material dentro de la cancha para cambiar su número, color,
                      tamaño o asignarle un jugador de tu plantilla.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Dorsal / Etiqueta">
                          <Input
                            value={selectedElement.label}
                            onChange={(e) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === selectedElement.id ? { ...el, label: e.target.value } : el,
                                ),
                              )
                            }
                          />
                        </Field>
                        <Field label="Color">
                          <input
                            type="color"
                            value={selectedElement.color}
                            onChange={(e) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === selectedElement.id ? { ...el, color: e.target.value } : el,
                                ),
                              )
                            }
                            className="h-9 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </Field>
                      </div>

                      <Field label="Nombre corto debajo de la ficha">
                        <Input
                          value={selectedElement.sublabel ?? ''}
                          placeholder="Ej. Capitán, Pivote, Apoyo..."
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id ? { ...el, sublabel: e.target.value } : el,
                              ),
                            )
                          }
                        />
                      </Field>

                      {(selectedElement.kind === 'player_own' || selectedElement.kind === 'goalkeeper') && (
                        <Field label="Vincular con jugador real">
                          <Select
                            value={selectedElement.playerId ?? ''}
                            onChange={(e) => {
                              const p = players?.find((x) => x.id === e.target.value);
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === selectedElement.id
                                    ? {
                                        ...el,
                                        playerId: e.target.value || undefined,
                                        label:
                                          p?.jerseyNumber != null ? String(p.jerseyNumber) : el.label,
                                        sublabel: p ? p.firstName : el.sublabel,
                                      }
                                    : el,
                                ),
                              );
                            }}
                          >
                            <option value="">Sin vincular</option>
                            {(players ?? []).map((p) => (
                              <option key={p.id} value={p.id}>
                                {fullName(p)} {p.jerseyNumber != null ? `(#${p.jerseyNumber})` : ''}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      )}

                      <Field label={`Tamaño de ficha (${Math.round((selectedElement.size ?? 1) * 100)}%)`}>
                        <input
                          type="range"
                          min={0.8}
                          max={1.4}
                          step={0.05}
                          value={selectedElement.size ?? 1}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id
                                  ? { ...el, size: Number(e.target.value) }
                                  : el,
                              ),
                            )
                          }
                          className="w-full accent-brand-600"
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {/* Edición del paso actual */}
                {activeFrame && (
                  <div className="space-y-4 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Configuración del Paso #{activeFrameIdx + 1}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nombre del paso">
                        <Input
                          value={activeFrame.name}
                          onChange={(e) =>
                            setKeyframes((prev) =>
                              prev.map((kf, i) =>
                                i === activeFrameIdx ? { ...kf, name: e.target.value } : kf,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Duración (ms)">
                        <Input
                          type="number"
                          min={300}
                          max={6000}
                          step={100}
                          value={activeFrame.durationMs}
                          onChange={(e) =>
                            setKeyframes((prev) =>
                              prev.map((kf, i) =>
                                i === activeFrameIdx
                                  ? { ...kf, durationMs: Math.max(300, Number(e.target.value) || 1200) }
                                  : kf,
                              ),
                            )
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Nota táctica de este paso">
                      <Input
                        value={activeFrame.notes ?? ''}
                        placeholder="Ej. Perfilarse antes de recibir..."
                        onChange={(e) =>
                          setKeyframes((prev) =>
                            prev.map((kf, i) =>
                              i === activeFrameIdx ? { ...kf, notes: e.target.value } : kf,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                )}
              </CardBody>
            ) : (
              <CardBody className="space-y-4 p-5">
                <Field label="Título de la jugada o ejercicio" required>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Clasificación">
                    <Select value={kind} onChange={(e) => setKind(e.target.value as CaorPlay['kind'])}>
                      <option value="jugada">Jugada táctica</option>
                      <option value="ejercicio">Ejercicio de cancha</option>
                      <option value="balon_parado">Balón parado</option>
                      <option value="automatismo">Automatismo</option>
                    </Select>
                  </Field>
                  <Field label="Carpeta en Biblioteca">
                    <Input
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                      placeholder="Ej. Salida de balón"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Categoría">
                    <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                      <option value="">Todas</option>
                      {(categories ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Minutos">
                    <Input
                      type="number"
                      min={5}
                      max={120}
                      value={durationMin}
                      onChange={(e) => setDurationMin(Math.max(1, Number(e.target.value) || 15))}
                    />
                  </Field>
                  <Field label="Intensidad">
                    <Select
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value as NonNullable<CaorPlay['intensity']>)}
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="maxima">Máxima</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Objetivo táctico">
                  <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
                </Field>
                <Field label="Descripción y consignas">
                  <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
                <Field label="Etiquetas (separadas por coma)">
                  <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
                </Field>
                <Button className="w-full" onClick={() => savePlay(false)}>
                  <Save className="h-4 w-4" /> Guardar en Mi Biblioteca
                </Button>
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
