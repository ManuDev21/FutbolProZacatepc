import type { LineupSlot, SportFormat } from '@/types';

/**
 * Presets de formaciones para la pizarra táctica.
 * x: 0 (izquierda) → 1 (derecha). y: 0 (portería propia, abajo) → 1 (ataque, arriba).
 */

type SlotDef = Pick<LineupSlot, 'x' | 'y' | 'label'>;

function slots(defs: SlotDef[]): LineupSlot[] {
  return defs.map((d, i) => ({ ...d, key: `s${i}` }));
}

const GK: SlotDef = { x: 0.5, y: 0.1, label: 'POR' };

function line(labels: string[], y: number, spread = 0.72): SlotDef[] {
  const n = labels.length;
  if (n === 1) return [{ x: 0.5, y, label: labels[0] }];
  const safeSpread = Math.min(spread, 0.76);
  const start = 0.5 - safeSpread / 2;
  const step = safeSpread / (n - 1);
  return labels.map((label, i) => ({ x: start + step * i, y, label }));
}

function f11(lines: SlotDef[][]): LineupSlot[] {
  return slots([GK, ...lines.flat()]);
}

export const FORMATIONS_11: Record<string, LineupSlot[]> = {
  '4-4-2': f11([
    line(['LI', 'DFC', 'DFC', 'LD'], 0.26),
    line(['MI', 'MC', 'MC', 'MD'], 0.5),
    line(['DC', 'DC'], 0.8, 0.36),
  ]),
  '4-3-3': f11([
    line(['LI', 'DFC', 'DFC', 'LD'], 0.26),
    line(['MC', 'MC', 'MC'], 0.5, 0.5),
    line(['EI', 'DC', 'ED'], 0.8),
  ]),
  '4-2-3-1': f11([
    line(['LI', 'DFC', 'DFC', 'LD'], 0.26),
    line(['MCD', 'MCD'], 0.43, 0.3),
    line(['EI', 'MCO', 'ED'], 0.62, 0.62),
    line(['DC'], 0.82),
  ]),
  '3-5-2': f11([
    line(['DFC', 'DFC', 'DFC'], 0.26, 0.5),
    line(['CI', 'MCD', 'MC', 'MCD', 'CD'], 0.5, 0.86),
    line(['DC', 'DC'], 0.8, 0.36),
  ]),
  '5-3-2': f11([
    line(['LI', 'DFC', 'DFC', 'DFC', 'LD'], 0.26, 0.86),
    line(['MC', 'MC', 'MC'], 0.52, 0.5),
    line(['DC', 'DC'], 0.8, 0.36),
  ]),
  '3-4-3': f11([
    line(['DFC', 'DFC', 'DFC'], 0.26, 0.5),
    line(['MI', 'MC', 'MC', 'MD'], 0.5),
    line(['EI', 'DC', 'ED'], 0.8),
  ]),
  '4-5-1': f11([
    line(['LI', 'DFC', 'DFC', 'LD'], 0.26),
    line(['MI', 'MC', 'MC', 'MC', 'MD'], 0.52, 0.86),
    line(['DC'], 0.82),
  ]),
  '4-1-4-1': f11([
    line(['LI', 'DFC', 'DFC', 'LD'], 0.26),
    line(['MCD'], 0.4),
    line(['MI', 'MC', 'MC', 'MD'], 0.6),
    line(['DC'], 0.82),
  ]),
  '5-4-1': f11([
    line(['LI', 'DFC', 'DFC', 'DFC', 'LD'], 0.26, 0.86),
    line(['MI', 'MC', 'MC', 'MD'], 0.52),
    line(['DC'], 0.82),
  ]),
  '4-4-1-1': f11([
    line(['LI', 'DFC', 'DFC', 'LD'], 0.26),
    line(['MI', 'MC', 'MC', 'MD'], 0.48),
    line(['MP'], 0.66),
    line(['DC'], 0.84),
  ]),
};

function f7(lines: SlotDef[][]): LineupSlot[] {
  return slots([GK, ...lines.flat()]);
}

export const FORMATIONS_7: Record<string, LineupSlot[]> = {
  '3-2-1': f7([line(['DFI', 'DFC', 'DFD'], 0.3, 0.6), line(['MED', 'MED'], 0.58, 0.44), line(['DEL'], 0.84)]),
  '2-3-1': f7([line(['DEF', 'DEF'], 0.3, 0.44), line(['EI', 'MED', 'ED'], 0.56, 0.7), line(['DEL'], 0.84)]),
  '2-2-2': f7([
    line(['DEF', 'DEF'], 0.3, 0.44),
    line(['MED', 'MED'], 0.56, 0.44),
    line(['DEL', 'DEL'], 0.82, 0.44),
  ]),
  '3-1-2': f7([line(['DFI', 'DFC', 'DFD'], 0.3, 0.6), line(['MED'], 0.55), line(['DEL', 'DEL'], 0.82, 0.44)]),
  '2-1-2-1': f7([
    line(['DEF', 'DEF'], 0.3, 0.44),
    line(['MCD'], 0.46),
    line(['MED', 'MED'], 0.64, 0.5),
    line(['DEL'], 0.86),
  ]),
  '1-3-2': f7([line(['DFC'], 0.28), line(['EI', 'MED', 'ED'], 0.52, 0.7), line(['DEL', 'DEL'], 0.8, 0.44)]),
  '4-1-1': f7([line(['LI', 'DFC', 'DFC', 'LD'], 0.32, 0.76), line(['MED'], 0.58), line(['DEL'], 0.84)]),
};

export function formationsFor(format: SportFormat): Record<string, LineupSlot[]> {
  return format === 11 ? FORMATIONS_11 : FORMATIONS_7;
}

export function defaultFormation(format: SportFormat): string {
  return format === 11 ? '4-4-2' : '3-2-1';
}
