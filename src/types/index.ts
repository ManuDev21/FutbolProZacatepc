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
