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
  Sparkles,
  FolderOpen,
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
  { kind: 'player_own', name: 'Jugador Cañeros', defaultLabel: '10', defaultColor: '#177541' },
  { kind: 'player_rival', name: 'Jugador Rival', defaultLabel: 'R', defaultColor: '#dc2626' },
  { kind: 'goalkeeper', name: 'Portero', defaultLabel: '1', defaultColor: '#f5a801' },
  { kind: 'coach', name: 'Entrenador', defaultLabel: 'DT', defaultColor: '#0284c7' },
  { kind: 'ball', name: 'Balón', defaultLabel: '⚽', defaultColor: '#ffffff' },
  { kind: 'cone', name: 'Cono', defaultLabel: '▲', defaultColor: '#f97316' },
  { kind: 'pole', name: 'Pica / Bastón', defaultLabel: '|', defaultColor: '#eab308' },
  { kind: 'hurdle', name: 'Valla', defaultLabel: '∏', defaultColor: '#facc15' },
  { kind: 'ladder', name: 'Escalera', defaultLabel: '▤', defaultColor: '#38bdf8' },
  { kind: 'ring', name: 'Aro coordinación', defaultLabel: '◯', defaultColor: '#a855f7' },
  { kind: 'mannequin', name: 'Maniquí / Barrera', defaultLabel: '🧍', defaultColor: '#64748b' },
  { kind: 'minigoal', name: 'Mini portería', defaultLabel: '🥅', defaultColor: '#e2e8f0' },
  { kind: 'zone', name: 'Zona / Cuadrante', defaultLabel: 'ZONA', defaultColor: '#22c55e' },
];

const INITIAL_ELEMENTS: CaorCanvasElement[] = [
  { id: 'gk-1', kind: 'goalkeeper', label: '1', color: '#f5a801', x: 0.08, y: 0.5 },
  { id: 'own-4', kind: 'player_own', label: '4', color: '#177541', x: 0.24, y: 0.32 },
  { id: 'own-5', kind: 'player_own', label: '5', color: '#177541', x: 0.24, y: 0.68 },
  { id: 'own-6', kind: 'player_own', label: '6', color: '#177541', x: 0.44, y: 0.5 },
  { id: 'own-8', kind: 'player_own', label: '8', color: '#177541', x: 0.62, y: 0.28 },
  { id: 'own-10', kind: 'player_own', label: '10', color: '#177541', x: 0.62, y: 0.72 },
  { id: 'own-9', kind: 'player_own', label: '9', color: '#177541', x: 0.82, y: 0.5 },
  { id: 'riv-1', kind: 'player_rival', label: 'R1', color: '#dc2626', x: 0.55, y: 0.42 },
  { id: 'riv-2', kind: 'player_rival', label: 'R2', color: '#dc2626', x: 0.72, y: 0.52 },
  { id: 'ball-1', kind: 'ball', label: '⚽', color: '#ffffff', x: 0.46, y: 0.48 },
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
    else if (el.id === 'own-8') pos2[el.id] = { x: 0.74, y: 0.22 };
    else if (el.id === 'own-9') pos2[el.id] = { x: 0.88, y: 0.46 };
    else if (el.id === 'ball-1') pos2[el.id] = { x: 0.74, y: 0.24 };
    else pos2[el.id] = { x: el.x, y: el.y };
  }
  const pos3: Record<string, { x: number; y: number }> = {};
  for (const el of elements) {
    if (el.id === 'own-9') pos3[el.id] = { x: 0.9, y: 0.5 };
    else if (el.id === 'own-10') pos3[el.id] = { x: 0.8, y: 0.64 };
    else if (el.id === 'ball-1') pos3[el.id] = { x: 0.95, y: 0.5 };
    else pos3[el.id] = pos2[el.id] ?? { x: el.x, y: el.y };
  }
  return [
    { id: 'kf-1', name: 'Paso 1 · Inicio', durationMs: 1400, positions: pos1, arrows: [] },
    { id: 'kf-2', name: 'Paso 2 · Ruptura por banda', durationMs: 1400, positions: pos2, arrows: [] },
    { id: 'kf-3', name: 'Paso 3 · Centro y remate', durationMs: 1400, positions: pos3, arrows: [] },
  ];
}

export default function CaorStudioPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plays = useCaorPlays();
  const categories = useCategories();
  const players = usePlayers();

  const [currentPlayId, setCurrentPlayId] = useState<string | null>(null);
  const [title, setTitle] = useState('Salida limpia + Ruptura exterior');
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
  const [playProgress, setPlayProgress] = useState(0); // 0..1

  const pitchRef = useRef<HTMLDivElement>(null);
  const draggingIdRef = useRef<string | null>(null);
  const liveRecTimerRef = useRef<number | null>(null);

  // Cargar jugada si viene ?id= en la URL
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
      x: firstFrame?.positions[el.id]?.x ?? el.x,
      y: firstFrame?.positions[el.id]?.y ?? el.y,
    }));
    setElements(hydrated);
    setKeyframes(
      p.keyframes.length > 0
        ? p.keyframes.map((k) => ({ ...k, positions: { ...k.positions }, arrows: k.arrows ?? [] }))
        : [{ id: uuid(), name: 'Paso 1 · Inicio', durationMs: 1400, positions: snapshotPositions(hydrated), arrows: [] }],
    );
    setActiveFrameIdx(0);
    setSelectedId(hydrated[0]?.id ?? null);
  };

  // Cambiar de fotograma activo sincroniza las posiciones de los elementos
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

  // Motor de animación fluida entre keyframes
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
    const segDurations = keyframes.slice(0, segments).map((k) => Math.max(300, (k.durationMs || 1400) / speed));
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

      // Localizar segmento actual
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
      // Suavizado easeInOutCubic
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

  // Grabación en vivo mientras el usuario mueve elementos
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
            name: `Paso ${nextNum} (en vivo)`,
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

  // Coordenadas normalizadas del puntero sobre la cancha
  const getCoords = (clientX: number, clientY: number) => {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0.5, y: 0.5 };
    return {
      x: clamp((clientX - rect.left) / rect.width, 0.03, 0.97),
      y: clamp((clientY - rect.top) / rect.height, 0.04, 0.96),
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

  // Dibujo de flechas tácticas sobre la cancha
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
        arrow_run: { kind: 'run' as const, color: '#f5a801' },
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

  // Agregar nuevo elemento desde la paleta
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
      x: clamp(0.35 + (sameKindCount % 5) * 0.07, 0.1, 0.9),
      y: clamp(0.3 + (sameKindCount % 4) * 0.12, 0.12, 0.88),
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

  // ➕ Duplicar jugador o elemento seleccionado
  const duplicateSelected = () => {
    const sel = elements.find((e) => e.id === selectedId);
    if (!sel) {
      toast.info('Selecciona primero un jugador o elemento en la cancha');
      return;
    }
    const numeric = Number(sel.label);
    const nextLabel = !Number.isNaN(numeric) && numeric > 0 ? String(numeric + 1) : `${sel.label}+`;
    const copy: CaorCanvasElement = {
      ...sel,
      id: uuid(),
      label: nextLabel,
      x: clamp(sel.x + 0.05, 0.05, 0.95),
      y: clamp(sel.y + 0.06, 0.06, 0.94),
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
              x: clamp(basePos.x + 0.05, 0.05, 0.95),
              y: clamp(basePos.y + 0.06, 0.06, 0.94),
            },
          },
        };
      }),
    );
    setSelectedId(copy.id);
    toast.success('Elemento duplicado', `${copy.label} añadido a la cancha`);
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

  // 🎥 Grabar un nuevo paso (keyframe) clonando las posiciones actuales
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
    toast.success(`Paso ${nextNum} grabado`, 'Ahora mueve jugadores o balón para configurar este fotograma.');
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

  // Plantillas rápidas
  const loadPresetFormation = (preset: 'rondo' | 'salida_f11' | 'ataque_f7' | 'vacio') => {
    setIsPlaying(false);
    if (preset === 'vacio') {
      const ballOnly: CaorCanvasElement[] = [
        { id: uuid(), kind: 'ball', label: '⚽', color: '#ffffff', x: 0.5, y: 0.5 },
      ];
      setElements(ballOnly);
      setKeyframes([{ id: uuid(), name: 'Paso 1 · Inicio', durationMs: 1400, positions: snapshotPositions(ballOnly), arrows: [] }]);
      setActiveFrameIdx(0);
      return;
    }
    if (preset === 'rondo') {
      setPitchType('grid');
      setTitle('Rondo 4 vs 2 en espacio reducido');
      setKind('ejercicio');
      const els: CaorCanvasElement[] = [
        { id: uuid(), kind: 'zone', label: 'RONDO 12x12m', color: '#22c55e', x: 0.5, y: 0.5, width: 0.48, height: 0.56 },
        { id: uuid(), kind: 'cone', label: '▲', color: '#f97316', x: 0.26, y: 0.22 },
        { id: uuid(), kind: 'cone', label: '▲', color: '#f97316', x: 0.74, y: 0.22 },
        { id: uuid(), kind: 'cone', label: '▲', color: '#f97316', x: 0.26, y: 0.78 },
        { id: uuid(), kind: 'cone', label: '▲', color: '#f97316', x: 0.74, y: 0.78 },
        { id: uuid(), kind: 'player_own', label: 'A', color: '#177541', x: 0.5, y: 0.2 },
        { id: uuid(), kind: 'player_own', label: 'B', color: '#177541', x: 0.76, y: 0.5 },
        { id: uuid(), kind: 'player_own', label: 'C', color: '#177541', x: 0.5, y: 0.8 },
        { id: uuid(), kind: 'player_own', label: 'D', color: '#177541', x: 0.24, y: 0.5 },
        { id: uuid(), kind: 'player_rival', label: 'R1', color: '#dc2626', x: 0.45, y: 0.44 },
        { id: uuid(), kind: 'player_rival', label: 'R2', color: '#dc2626', x: 0.56, y: 0.56 },
        { id: uuid(), kind: 'ball', label: '⚽', color: '#ffffff', x: 0.5, y: 0.24 },
      ];
      setElements(els);
      setKeyframes([{ id: uuid(), name: 'Paso 1 · Inicio Rondo', durationMs: 1200, positions: snapshotPositions(els), arrows: [] }]);
      setActiveFrameIdx(0);
      return;
    }
    if (preset === 'ataque_f7') {
      setPitchType('f7');
      setTitle('Oleada ofensiva 2-3-1 Fútbol 7');
      setKind('jugada');
      const els: CaorCanvasElement[] = [
        { id: uuid(), kind: 'goalkeeper', label: '1', color: '#f5a801', x: 0.08, y: 0.5 },
        { id: uuid(), kind: 'player_own', label: '2', color: '#177541', x: 0.26, y: 0.3 },
        { id: uuid(), kind: 'player_own', label: '3', color: '#177541', x: 0.26, y: 0.7 },
        { id: uuid(), kind: 'player_own', label: '6', color: '#177541', x: 0.5, y: 0.5 },
        { id: uuid(), kind: 'player_own', label: '7', color: '#177541', x: 0.58, y: 0.2 },
        { id: uuid(), kind: 'player_own', label: '11', color: '#177541', x: 0.58, y: 0.8 },
        { id: uuid(), kind: 'player_own', label: '9', color: '#177541', x: 0.8, y: 0.5 },
        { id: uuid(), kind: 'ball', label: '⚽', color: '#ffffff', x: 0.52, y: 0.48 },
      ];
      setElements(els);
      setKeyframes([{ id: uuid(), name: 'Paso 1 · Estructura 2-3-1', durationMs: 1300, positions: snapshotPositions(els), arrows: [] }]);
      setActiveFrameIdx(0);
      return;
    }
    // salida_f11
    setPitchType('f11');
    setElements(INITIAL_ELEMENTS);
    setKeyframes(makeDefaultKeyframes(INITIAL_ELEMENTS));
    setActiveFrameIdx(0);
  };

  // 💾 Guardar jugada/ejercicio en IndexedDB
  const savePlay = async (alsoExportToExercises = false) => {
    if (!title.trim()) {
      toast.warning('Escribe un título para la jugada o ejercicio');
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
      toast.success('Jugada CAOR actualizada', title);
    } else {
      saved = await caorPlaysService.create(payload);
      setCurrentPlayId(saved.id);
      toast.success('Guardado en tu Biblioteca CAOR', title);
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
    <div>
      <CaorSubnav />

      <PageHeader
        title="Estudio Táctico & Ejercicios CAOR"
        subtitle="↔️ Mueve elementos · ➕ Duplica jugadores · 🎥 Graba movimientos · ▶️ Reproduce tus jugadas · 💾 Guarda en tu biblioteca"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setCurrentPlayId(null);
                loadPresetFormation('salida_f11');
                toast.info('Lienzo reiniciado');
              }}
            >
              <RotateCcw className="h-4 w-4" /> Nueva jugada
            </Button>
            <Button variant="secondary" size="sm" onClick={() => savePlay(true)}>
              <BookPlus className="h-4 w-4" /> Guardar + Enviar a Ejercicios
            </Button>
            <Button size="sm" onClick={() => savePlay(false)}>
              <Save className="h-4 w-4" /> {currentPlayId ? 'Actualizar en CAOR' : 'Guardar en Biblioteca CAOR'}
            </Button>
          </div>
        }
      />

      {/* Barra de herramientas principal */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Paleta de elementos arrastrables */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold text-zinc-500 uppercase">Añadir a cancha:</span>
            {PALETTE.map((item) => (
              <button
                key={item.kind}
                type="button"
                onClick={() => addElement(item)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:border-brand-500 hover:bg-brand-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                title={`Añadir ${item.name}`}
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: item.kind === 'ball' ? '#177541' : item.defaultColor }}
                >
                  {item.defaultLabel.slice(0, 2)}
                </span>
                {item.name}
              </button>
            ))}
          </div>

          {/* Acciones sobre selección */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="gold" size="sm" onClick={duplicateSelected} title="Duplicar elemento seleccionado">
              <Copy className="h-3.5 w-3.5" /> ➕ Duplicar jugador/item
            </Button>
            {selectedElement && (
              <Button variant="danger" size="sm" onClick={removeSelected} title="Eliminar elemento seleccionado">
                <Trash2 className="h-3.5 w-3.5" /> Quitar
              </Button>
            )}
          </div>
        </div>

        {/* Segunda fila: modo puntero / flechas / plantillas */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500">Herramienta:</span>
            <button
              type="button"
              onClick={() => setToolMode('move')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
                toolMode === 'move'
                  ? 'bg-brand-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
              )}
            >
              <Move className="h-3.5 w-3.5" /> ↔️ Mover elementos
            </button>
            <button
              type="button"
              onClick={() => setToolMode('arrow_pass')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
                toolMode === 'arrow_pass'
                  ? 'bg-brand-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Pase (línea)
            </button>
            <button
              type="button"
              onClick={() => setToolMode('arrow_run')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
                toolMode === 'arrow_run'
                  ? 'bg-gold-500 text-brand-950'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Desmarque (punteada)
            </button>
            <button
              type="button"
              onClick={() => setToolMode('arrow_shoot')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
                toolMode === 'arrow_shoot'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Disparo (roja)
            </button>
            {(activeFrame?.arrows?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={clearArrowsInFrame}
                className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Limpiar flechas ({activeFrame.arrows?.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500">Cancha:</span>
            {(
              [
                ['f11', 'Fútbol 11'],
                ['f7', 'Fútbol 7'],
                ['half', 'Media cancha'],
                ['grid', 'Espacio reducido'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPitchType(k)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold',
                  pitchType === k
                    ? 'bg-brand-700 text-white'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
                )}
              >
                {label}
              </button>
            ))}

            <span className="ml-2 text-xs font-semibold text-zinc-500">Plantillas:</span>
            <button
              type="button"
              onClick={() => loadPresetFormation('salida_f11')}
              className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800"
            >
              Salida F11
            </button>
            <button
              type="button"
              onClick={() => loadPresetFormation('ataque_f7')}
              className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800"
            >
              Ataque F7
            </button>
            <button
              type="button"
              onClick={() => loadPresetFormation('rondo')}
              className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800"
            >
              Rondo 4v2
            </button>
            <button
              type="button"
              onClick={() => loadPresetFormation('vacio')}
              className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800"
            >
              Vaciar
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Columna izquierda: Cancha interactiva + Reproductor de jugadas */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            {/* Cancha */}
            <div
              ref={pitchRef}
              onPointerDown={handlePitchPointerDown}
              onPointerUp={handlePitchPointerUp}
              className={cn(
                'relative mx-auto aspect-16/10 w-full touch-none select-none overflow-hidden',
                toolMode !== 'move' && 'cursor-crosshair',
              )}
              style={{
                background:
                  pitchType === 'grid'
                    ? 'repeating-linear-gradient(90deg, #156839 0 12.5%, #125c32 12.5% 25%)'
                    : 'repeating-linear-gradient(90deg, #177541 0 10%, #126534 10% 20%)',
              }}
            >
              {/* Marcaje SVG de la cancha según tipo */}
              <svg viewBox="0 0 160 100" className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                  <marker id="arrow-white" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#ffffff" />
                  </marker>
                  <marker id="arrow-gold" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#f5a801" />
                  </marker>
                  <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                  </marker>
                </defs>

                <g stroke="rgba(255,255,255,0.6)" strokeWidth="0.7" fill="none">
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
                      {/* Área izquierda */}
                      <rect x="4" y="22" width="24" height="56" />
                      <rect x="4" y="36" width="9" height="28" />
                      {/* Área derecha */}
                      <rect x="132" y="22" width="24" height="56" />
                      <rect x="147" y="36" width="9" height="28" />
                    </>
                  )}
                </g>

                {/* Trayectorias punteadas (fantasma de movimiento hacia el siguiente paso) */}
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

                {/* Flechas dibujadas en el fotograma activo */}
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
                          ? 'url(#arrow-gold)'
                          : 'url(#arrow-white)'
                    }
                  />
                ))}
              </svg>

              {/* Marca de agua Cañeros CAOR */}
              <img
                src="/logo.svg"
                alt=""
                className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-12"
              />

              {/* Indicador superior en cancha */}
              <div className="pointer-events-none absolute top-2 left-3 flex items-center gap-2">
                <span className="rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                  {activeFrame?.name ?? 'Paso 1'} ({activeFrameIdx + 1}/{keyframes.length})
                </span>
                {isLiveRecording && (
                  <span className="inline-flex animate-pulse items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    ● GRABANDO MOVIMIENTOS EN VIVO
                  </span>
                )}
              </div>

              {/* Elementos renderizados sobre la cancha */}
              {elements.map((el) => {
                const pos = currentPositions[el.id] ?? { x: el.x, y: el.y };
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
                        'absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-xl border-2 border-dashed flex items-start justify-start p-1.5 active:cursor-grabbing',
                        isSel && 'ring-2 ring-gold-400',
                      )}
                    >
                      <span className="rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
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
                          'flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow-lg ring-2 ring-black/30',
                          isSel && 'ring-4 ring-gold-400',
                        )}
                      >
                        ⚽
                      </div>
                    ) : el.kind === 'cone' ? (
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-sm text-xs font-black text-white shadow',
                          isSel && 'ring-2 ring-gold-400',
                        )}
                        style={{ backgroundColor: el.color }}
                      >
                        ▲
                      </div>
                    ) : el.kind === 'minigoal' || el.kind === 'hurdle' || el.kind === 'ladder' ? (
                      <div
                        className={cn(
                          'rounded border-2 px-2 py-0.5 text-[10px] font-extrabold text-zinc-900 shadow',
                          isSel && 'ring-2 ring-gold-400',
                        )}
                        style={{ backgroundColor: el.color, borderColor: '#0f172a' }}
                      >
                        {el.label}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white shadow-md transition-transform',
                          isSel && 'ring-4 ring-gold-400 scale-110',
                        )}
                        style={{ backgroundColor: el.color }}
                      >
                        {el.label}
                      </div>
                    )}
                    {(el.sublabel || linkedPlayer) && (
                      <span className="mt-0.5 max-w-24 truncate rounded bg-black/70 px-1.5 py-0.2 text-[10px] font-semibold text-white">
                        {linkedPlayer ? linkedPlayer.firstName : el.sublabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controles de Grabación y Reproducción (Timeline CAOR) */}
            <div className="border-t border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {!isPlaying ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsLiveRecording(false);
                        setIsPlaying(true);
                      }}
                    >
                      <Play className="h-4 w-4" /> ▶️ Reproducir jugada
                    </Button>
                  ) : (
                    <Button variant="gold" size="sm" onClick={() => setIsPlaying(false)}>
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
                    <Plus className="h-4 w-4" /> 🎥 Grabar paso ({keyframes.length})
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
                    {isLiveRecording ? 'Detener grabación en vivo' : 'Grabar en vivo al arrastrar'}
                  </Button>
                </div>

                {/* Velocidad, bucle y estelas */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoop((l) => !l)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-semibold',
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
                      'rounded-lg border px-2 py-1 font-semibold',
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
                    className="w-24 py-1 text-xs"
                  >
                    <option value="0.5">0.5x Lento</option>
                    <option value="1">1x Normal</option>
                    <option value="1.5">1.5x Rápido</option>
                    <option value="2">2x Turbo</option>
                  </Select>
                </div>
              </div>

              {/* Barra de progreso de animación */}
              {isPlaying && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full bg-brand-600 transition-all duration-75"
                    style={{ width: `${Math.round(playProgress * 100)}%` }}
                  />
                </div>
              )}

              {/* Tira de fotogramas (Keyframes) */}
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {keyframes.map((kf, idx) => (
                  <div
                    key={kf.id}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition',
                      idx === activeFrameIdx
                        ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-brand-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
                    )}
                  >
                    <button type="button" onClick={() => selectKeyframe(idx)} className="font-semibold">
                      {idx + 1}. {kf.name}
                    </button>
                    <span className="text-[10px] opacity-75">({(kf.durationMs / 1000).toFixed(1)}s)</span>
                    {keyframes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKeyframe(idx)}
                        className="ml-1 rounded p-0.5 opacity-70 hover:bg-black/20 hover:opacity-100"
                        title="Eliminar paso"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Biblioteca rápida de jugadas guardadas */}
          <Card>
            <CardHeader
              title="Mis Jugadas y Ejercicios CAOR guardados"
              subtitle="Haz clic en cualquiera para cargarlo, reproducirlo o editarlo"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/app/caor/biblioteca')}>
                  <FolderOpen className="h-4 w-4" /> Ver Biblioteca completa ({plays?.length ?? 0})
                </Button>
              }
            />
            <CardBody>
              {!plays || plays.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Aún no has guardado jugadas en tu biblioteca CAOR. Pulsa{' '}
                  <strong>“Guardar en Biblioteca CAOR”</strong> arriba para almacenar esta jugada.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {plays.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => loadPlayIntoStudio(p)}
                      className={cn(
                        'cursor-pointer rounded-xl border p-3 transition hover:border-brand-500 hover:shadow-xs',
                        currentPlayId === p.id
                          ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30'
                          : 'border-zinc-200 dark:border-zinc-800',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone="green">{p.kind}</Badge>
                        <span className="text-[11px] text-zinc-400">{p.keyframes.length} pasos</span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-bold">{p.title}</p>
                      <p className="truncate text-xs text-zinc-500">{p.folder}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Columna derecha: Personalización 100% del elemento + Datos del Ejercicio */}
        <div className="space-y-4">
          {/* Inspector del elemento seleccionado */}
          <Card>
            <CardHeader
              title="Personalizar elemento"
              subtitle={selectedElement ? `Editando: ${selectedElement.label}` : 'Haz clic en una ficha'}
              action={
                selectedElement && (
                  <Button variant="secondary" size="sm" onClick={duplicateSelected}>
                    <Copy className="h-3.5 w-3.5" /> Duplicar
                  </Button>
                )
              }
            />
            <CardBody className="space-y-3">
              {!selectedElement ? (
                <p className="text-xs text-zinc-500">
                  Selecciona cualquier jugador, cono, zona o balón en la cancha para personalizar su dorsal,
                  color, tamaño o vincularlo a un jugador real.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
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

                  <Field label="Subtítulo / Rol en cancha">
                    <Input
                      value={selectedElement.sublabel ?? ''}
                      placeholder="Ej. Capitán, Pivote, Comodín..."
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
                    <Field label="Vincular con jugador del plantel">
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
                        <option value="">Sin vincular (libre)</option>
                        {(players ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {fullName(p)} {p.jerseyNumber != null ? `(#${p.jerseyNumber})` : ''}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}

                  <Field label={`Tamaño (${Math.round((selectedElement.size ?? 1) * 100)}%)`}>
                    <input
                      type="range"
                      min={0.75}
                      max={1.5}
                      step={0.05}
                      value={selectedElement.size ?? 1}
                      onChange={(e) =>
                        setElements((prev) =>
                          prev.map((el) =>
                            el.id === selectedElement.id ? { ...el, size: Number(e.target.value) } : el,
                          ),
                        )
                      }
                      className="w-full accent-brand-600"
                    />
                  </Field>
                </>
              )}
            </CardBody>
          </Card>

          {/* Inspector del paso activo */}
          {activeFrame && (
            <Card>
              <CardHeader title="Configurar paso actual" subtitle={`Fotograma #${activeFrameIdx + 1}`} />
              <CardBody className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nombre del paso">
                    <Input
                      value={activeFrame.name}
                      onChange={(e) =>
                        setKeyframes((prev) =>
                          prev.map((kf, i) => (i === activeFrameIdx ? { ...kf, name: e.target.value } : kf)),
                        )
                      }
                    />
                  </Field>
                  <Field label="Duración transición (ms)">
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
                <Field label="Consigna táctica de este paso">
                  <Input
                    value={activeFrame.notes ?? ''}
                    placeholder="Ej. El interior perfila antes de recibir..."
                    onChange={(e) =>
                      setKeyframes((prev) =>
                        prev.map((kf, i) => (i === activeFrameIdx ? { ...kf, notes: e.target.value } : kf)),
                      )
                    }
                  />
                </Field>
              </CardBody>
            </Card>
          )}

          {/* Ficha de guardado del Ejercicio / Jugada */}
          <Card>
            <CardHeader
              title="Ficha de la Jugada / Ejercicio"
              subtitle="100% editable para tu biblioteca propia"
            />
            <CardBody className="space-y-3">
              <Field label="Título" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Tipo">
                  <Select value={kind} onChange={(e) => setKind(e.target.value as CaorPlay['kind'])}>
                    <option value="jugada">Jugada táctica</option>
                    <option value="ejercicio">Ejercicio de cancha</option>
                    <option value="balon_parado">Balón parado (ABP)</option>
                    <option value="automatismo">Automatismo</option>
                  </Select>
                </Field>
                <Field label="Carpeta / Colección">
                  <Input
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="Ej. Salida de balón"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-2">
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
                <Field label="Duración (min)">
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
              <Field label="Objetivo principal">
                <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
              </Field>
              <Field label="Descripción / Reglas de provocación">
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field label="Etiquetas (separadas por coma)">
                <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
              </Field>
              <Button className="w-full" onClick={() => savePlay(false)}>
                <Sparkles className="h-4 w-4" /> 💾 Guardar en Mi Biblioteca CAOR
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
