/**
 * FútbolProZacatepec — Tipos centrales del dominio.
 * Todas las entidades persisten en IndexedDB vía Dexie.
 */

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type Role = 'admin' | 'coach' | 'parent';
export type SportFormat = 7 | 11;

export interface User extends BaseEntity {
  username: string;
  displayName: string;
  passwordHash: string; // SHA-256 — solo simulación local, no es seguridad real
  role: Role;
  coachId?: string;
  playerId?: string;
  active: boolean;
}

export interface School extends BaseEntity {
  name: string;
  logo?: string; // dataURL
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  primaryColor?: string;
  monthlyFee: number;
  currency: string;
  notes?: string;
}

export interface Category extends BaseEntity {
  name: string; // Sub-7, Sub-13, Sub-17
  minAge: number;
  maxAge: number;
  description?: string;
  format: SportFormat; // 7 u 11 jugadores en cancha
  active: boolean;
}

export interface Coach extends BaseEntity {
  firstName: string;
  lastName: string;
  photo?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  experienceYears?: number;
  categoryIds: string[];
  active: boolean;
}

export type PlayerStatus = 'activo' | 'lesionado' | 'inactivo' | 'baja';

export interface Player extends BaseEntity {
  firstName: string;
  lastName: string;
  photo?: string;
  birthDate: string; // ISO date
  categoryId?: string;
  position?: string;
  jerseyNumber?: number;
  phone?: string;
  status: PlayerStatus;
  joinedAt: string; // ISO date
  guardianId?: string;
  notes?: string;
}

export interface Guardian extends BaseEntity {
  firstName: string;
  lastName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  relationship?: string; // Padre, Madre, Tutor...
  playerIds: string[];
}

export interface Team extends BaseEntity {
  name: string;
  categoryId?: string;
  coachId?: string;
  playerIds: string[];
  active: boolean;
}

export type AttendanceStatus = 'presente' | 'ausente' | 'retardo' | 'justificado';

export interface AttendanceRecord {
  playerId: string;
  status: AttendanceStatus;
  time?: string; // HH:mm
  notes?: string;
}

/** Una sesión de asistencia: una categoría en una fecha (opcionalmente ligada a un entrenamiento). */
export interface Attendance extends BaseEntity {
  date: string; // ISO date
  categoryId: string;
  trainingId?: string;
  coachId?: string;
  records: AttendanceRecord[];
}

export interface Exercise extends BaseEntity {
  code: string; // identificador estable p.ej. GEN-0001 / CUR-0001
  name: string;
  description?: string;
  image?: string;
  video?: string;
  area?: string; // técnica, táctica, físico, porteros...
  minAge?: number;
  maxAge?: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  objective?: string;
  durationMin?: number;
  playersMin?: number;
  playersMax?: number;
  materials: string[];
  tags: string[]; // técnica, táctica, físico, finalización, posesión, velocidad, coordinación
  favorite: boolean;
  builtin: boolean;
}

export interface TrainingStep {
  exerciseId: string;
  durationMin: number;
  notes?: string;
}

export type TrainingLevel = 'iniciacion' | 'basico' | 'intermedio' | 'avanzado' | 'competitivo';

export interface Training extends BaseEntity {
  name: string;
  categoryId?: string;
  coachId?: string;
  date: string; // ISO date
  objective?: string;
  level: TrainingLevel;
  steps: TrainingStep[];
  notes?: string;
}

export type EvaluationPeriod = 'inicial' | 'mensual' | 'trimestral' | 'semestral' | 'final' | 'personalizada';

export interface EvaluationScores {
  tecnica: number; // 0-100
  velocidad: number;
  tactica: number;
  fisico: number;
  actitud: number;
}

export interface Evaluation extends BaseEntity {
  playerId: string;
  date: string;
  period: EvaluationPeriod;
  label?: string; // p.ej. "Septiembre 2026"
  scores: EvaluationScores;
  notes?: string;
  coachId?: string;
}

export type PaymentStatus = 'pagado' | 'pendiente' | 'vencido' | 'parcial';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'deposito' | 'otro';

export interface Payment extends BaseEntity {
  playerId: string;
  concept: string; // "Mensualidad", "Inscripción", "Uniforme"...
  period?: string; // "2026-09"
  amount: number;
  amountPaid?: number; // para pagos parciales
  dueDate: string; // ISO date
  paidAt?: string; // ISO date
  method?: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
}

export type FinanceType = 'ingreso' | 'gasto';

export interface FinanceMovement extends BaseEntity {
  type: FinanceType;
  concept: string;
  categoryLabel?: string; // Mensualidades, Uniformes, Renta, Material...
  amount: number;
  date: string;
  method?: PaymentMethod;
  description?: string;
  paymentId?: string;
}

export type NotificationKind = 'pago' | 'asistencia' | 'evaluacion' | 'entrenamiento' | 'sistema';

export interface NotificationItem extends BaseEntity {
  key: string; // dedup estable
  title: string;
  message: string;
  kind: NotificationKind;
  read: boolean;
  link?: string;
}

export type EventType = 'entrenamiento' | 'partido' | 'torneo' | 'reunion' | 'otro';

export interface EventItem extends BaseEntity {
  title: string;
  type: EventType;
  date: string; // ISO date
  endDate?: string;
  time?: string; // HH:mm
  location?: string;
  categoryId?: string;
  description?: string;
}

export interface ReportRecord extends BaseEntity {
  kind: 'jugador' | 'finanzas' | 'asistencia' | 'entrenamiento';
  label: string;
  playerId?: string;
}

export interface AuditLog extends BaseEntity {
  userId?: string;
  userName: string;
  action: string; // crear, actualizar, eliminar, exportar...
  entity: string; // jugador, pago...
  entityId?: string;
  detail?: string;
}

/** Slot del rompecabezas táctico. x/y normalizados 0-1 sobre la cancha. */
export interface LineupSlot {
  key: string;
  x: number; // 0 izquierda → 1 derecha
  y: number; // 0 defensa (abajo) → 1 ataque (arriba)
  label: string; // POR, DFC, MC, DEL...
  playerId?: string;
}

export interface Lineup extends BaseEntity {
  categoryId: string;
  name: string;
  formation: string; // "4-4-2", "2-3-1"...
  format: SportFormat;
  slots: LineupSlot[];
  notes?: string;
}

export interface Setting extends BaseEntity {
  key: string;
  value: unknown;
}

// ---------- Tipos de apoyo (no persistidos) ----------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlayerStats {
  attendance: {
    total: number;
    presentes: number;
    ausentes: number;
    retardos: number;
    justificados: number;
    porcentaje: number;
  };
  payments: { pagados: number; pendientes: number; vencidos: number; parciales: number };
  latestEvaluation?: Evaluation;
}

export const POSITIONS_F7 = [
  'Portero',
  'Defensa',
  'Lateral',
  'Mediocampista',
  'Volante',
  'Delantero',
] as const;

export const POSITIONS_F11 = [
  'Portero',
  'Defensa central',
  'Lateral derecho',
  'Lateral izquierdo',
  'Mediocentro defensivo',
  'Mediocentro',
  'Mediocentro ofensivo',
  'Extremo derecho',
  'Extremo izquierdo',
  'Delantero centro',
] as const;

// ============================================================================
// SISTEMA DIGITAL CAOR — Tipos interactivos 100% locales
// ============================================================================

export type CaorElementKind =
  | 'player_own'
  | 'player_rival'
  | 'goalkeeper'
  | 'coach'
  | 'ball'
  | 'cone'
  | 'pole'
  | 'hurdle'
  | 'ladder'
  | 'ring'
  | 'mannequin'
  | 'minigoal'
  | 'zone';

export type CaorPitchType = 'f11' | 'f7' | 'half' | 'grid';

/** Elemento sobre el lienzo del Estudio CAOR (x, y normalizados 0..1). */
export interface CaorCanvasElement {
  id: string;
  kind: CaorElementKind;
  label: string; // dorsal, nombre corto o etiqueta
  sublabel?: string;
  color: string; // hex
  x: number; // 0..1
  y: number; // 0..1
  size?: number; // escala opcional (0.8..1.6)
  rotation?: number; // grados
  width?: number; // para zonas (0..1)
  height?: number; // para zonas (0..1)
  playerId?: string; // vínculo opcional a jugador real
}

/** Flecha o línea táctica dibujada sobre la cancha. */
export interface CaorDrawingArrow {
  id: string;
  kind: 'pass' | 'run' | 'dribble' | 'shoot';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

/** Fotograma (keyframe) de una jugada o ejercicio animado CAOR. */
export interface CaorKeyframe {
  id: string;
  name: string; // "Inicio", "Paso 2 — Desmarque", etc.
  durationMs: number; // duración de la transición hacia el siguiente frame
  notes?: string;
  positions: Record<string, { x: number; y: number }>; // elementId -> coords
  arrows?: CaorDrawingArrow[];
}

/** Jugada / Ejercicio / Tarea interactiva guardada en el Sistema Digital CAOR. */
export interface CaorPlay extends BaseEntity {
  title: string;
  kind: 'jugada' | 'ejercicio' | 'balon_parado' | 'automatismo';
  folder: string; // colección/carpeta de biblioteca propia
  categoryId?: string;
  pitchType: CaorPitchType;
  objective?: string;
  description?: string;
  durationMin?: number;
  intensity?: 'baja' | 'media' | 'alta' | 'maxima';
  tags: string[];
  favorite: boolean;
  elements: CaorCanvasElement[];
  keyframes: CaorKeyframe[];
}

/** Día dentro de un microciclo de planificación CAOR. */
export interface CaorPlanDay {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  focus: string; // ej. "Activación + Posesión", "Descanso", "Partido J8"
  durationMin: number;
  rpe: number; // 1-10 carga percibida
  playIds: string[]; // jugadas/ejercicios CAOR asignados
  trainingId?: string;
  notes?: string;
}

/** Planificación deportiva CAOR (Microciclo / Mesociclo / Temporada). */
export interface CaorPlan extends BaseEntity {
  title: string;
  cycleType: 'microciclo' | 'mesociclo' | 'macrociclo';
  weekLabel?: string; // ej. "Semana 14 · Competitiva"
  categoryId?: string;
  coachId?: string;
  startDate: string;
  endDate: string;
  mainObjective: string;
  tacticalFocus?: string;
  physicalFocus?: string;
  status: 'borrador' | 'activo' | 'completado';
  days: CaorPlanDay[];
  notes?: string;
}

/** Jugador clave identificado en el scouting del rival. */
export interface CaorRivalKeyPlayer {
  id: string;
  jerseyNumber: number;
  name: string;
  position: string;
  threatLevel: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

/** Posición de un jugador rival en la pizarra de scouting. */
export interface CaorRivalSlot {
  id: string;
  number: number;
  label: string;
  x: number;
  y: number;
}

/** Informe de Análisis del Rival (Scouting CAOR). */
export interface CaorRivalReport extends BaseEntity {
  rivalName: string;
  matchDate?: string;
  competition?: string;
  categoryId?: string;
  format: SportFormat;
  formationOffense: string; // ej. "1-4-3-3"
  formationDefense: string; // ej. "1-4-4-2"
  playingStyle: string;
  strengths: string[];
  weaknesses: string[];
  attackingPatterns?: string;
  defensiveTransition?: string;
  setPiecesInfo?: string;
  gamePlan?: string;
  keyPlayers: CaorRivalKeyPlayer[];
  lineupSlots: CaorRivalSlot[];
}

export type CaorTestCategory = 'velocidad' | 'resistencia' | 'fuerza' | 'agilidad' | 'tecnica' | 'personalizado';

/** Registro de un Test físico/técnico CAOR. */
export interface CaorTestRecord extends BaseEntity {
  playerId: string;
  categoryId?: string;
  testName: string; // ej. "Sprint 30m", "Yo-Yo IR1", "Salto CMJ"
  testCategory: CaorTestCategory;
  date: string;
  value: number;
  unit: string; // "seg", "cm", "nivel", "pts", "km/h"
  betterDirection: 'higher' | 'lower'; // menor es mejor para segs, mayor para cm/pts
  benchmark?: number; // marca objetivo de referencia
  notes?: string;
}

/** Ficha técnica CAOR extendida por jugador (atributos editables personalizados). */
export interface CaorPlayerProfile extends BaseEntity {
  playerId: string;
  preferredFoot: 'derecho' | 'izquierdo' | 'ambidiestro';
  heightCm?: number;
  weightKg?: number;
  secondaryPositions: string[];
  tacticalRole?: string; // ej. "Organizador adelantado", "Carrilero profundo"
  strengths: string[];
  improvementGoals: string[];
  individualPlan?: string;
  customAttributes: { label: string; value: number }[]; // 0-100 100% personalizable
}

