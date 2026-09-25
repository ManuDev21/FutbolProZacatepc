import { z } from 'zod';

/** Esquemas Zod compartidos — mensajes en español. Sin coerce/default: input === output. */

const required = 'Campo obligatorio';
const phoneRe = /^[\d+\s()-]{7,17}$/;

export const phoneSchema = z.string().regex(phoneRe, 'Teléfono no válido').or(z.literal('')).optional();

export const playerSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(60),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(80),
  birthDate: z.string().min(1, required),
  categoryId: z.string().optional(),
  position: z.string().optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  phone: phoneSchema,
  status: z.enum(['activo', 'lesionado', 'inactivo', 'baja']),
  joinedAt: z.string().min(1, required),
  guardianId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});
export type PlayerForm = z.infer<typeof playerSchema>;

export const categorySchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(40),
    minAge: z.number('Edad requerida').int().min(3, 'Edad mínima 3').max(30),
    maxAge: z.number('Edad requerida').int().min(3).max(30),
    description: z.string().max(300).optional(),
    format: z.union([z.literal(7), z.literal(11)]),
    active: z.boolean(),
  })
  .refine((d) => d.minAge <= d.maxAge, {
    message: 'La edad mínima no puede ser mayor que la máxima',
    path: ['minAge'],
  });
export type CategoryForm = z.infer<typeof categorySchema>;

export const coachSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(80),
  phone: phoneSchema,
  email: z.string().email('Email no válido').or(z.literal('')).optional(),
  specialty: z.string().max(80).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  categoryIds: z.array(z.string()),
  active: z.boolean(),
});
export type CoachForm = z.infer<typeof coachSchema>;

export const guardianSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(80),
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: z.string().email('Email no válido').or(z.literal('')).optional(),
  relationship: z.string().max(40).optional(),
  playerIds: z.array(z.string()),
});
export type GuardianForm = z.infer<typeof guardianSchema>;

export const teamSchema = z.object({
  name: z.string().min(2).max(60),
  categoryId: z.string().optional(),
  coachId: z.string().optional(),
  playerIds: z.array(z.string()),
  active: z.boolean(),
});
export type TeamForm = z.infer<typeof teamSchema>;

export const paymentSchema = z.object({
  playerId: z.string().min(1, 'Selecciona un jugador'),
  concept: z.string().min(2).max(80),
  period: z.string().optional(),
  amount: z.number('Monto requerido').positive('El monto debe ser mayor a 0'),
  dueDate: z.string().min(1, required),
  notes: z.string().max(500).optional(),
});
export type PaymentForm = z.infer<typeof paymentSchema>;

export const financeSchema = z.object({
  type: z.enum(['ingreso', 'gasto']),
  concept: z.string().min(2).max(80),
  categoryLabel: z.string().max(60).optional(),
  amount: z.number('Monto requerido').positive('El monto debe ser mayor a 0'),
  date: z.string().min(1, required),
  method: z.enum(['efectivo', 'transferencia', 'tarjeta', 'deposito', 'otro']).optional(),
  description: z.string().max(500).optional(),
});
export type FinanceForm = z.infer<typeof financeSchema>;

const score = z.number('Requerido').min(0, 'Rango 0-100').max(100, 'Rango 0-100');

export const evaluationSchema = z.object({
  playerId: z.string().min(1, 'Selecciona un jugador'),
  date: z.string().min(1, required),
  period: z.enum(['inicial', 'mensual', 'trimestral', 'semestral', 'final', 'personalizada']),
  label: z.string().max(60).optional(),
  tecnica: score,
  velocidad: score,
  tactica: score,
  fisico: score,
  actitud: score,
  notes: z.string().max(1000).optional(),
});
export type EvaluationForm = z.infer<typeof evaluationSchema>;

export const exerciseSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  area: z.string().optional(),
  minAge: z.number().int().min(3).max(30).optional(),
  maxAge: z.number().int().min(3).max(30).optional(),
  difficulty: z.number('Requerido').int().min(1).max(5),
  objective: z.string().max(120).optional(),
  durationMin: z.number().int().min(1).max(240).optional(),
  playersMin: z.number().int().min(1).max(40).optional(),
  playersMax: z.number().int().min(1).max(60).optional(),
  materials: z.string().optional(), // separados por coma
  tags: z.array(z.string()),
});
export type ExerciseForm = z.infer<typeof exerciseSchema>;

export const eventSchema = z.object({
  title: z.string().min(2).max(100),
  type: z.enum(['entrenamiento', 'partido', 'torneo', 'reunion', 'otro']),
  date: z.string().min(1, required),
  endDate: z.string().optional(),
  time: z.string().optional(),
  location: z.string().max(120).optional(),
  categoryId: z.string().optional(),
  description: z.string().max(500).optional(),
});
export type EventForm = z.infer<typeof eventSchema>;

export const schoolSchema = z.object({
  name: z.string().min(2).max(120),
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: z.string().email('Email no válido').or(z.literal('')).optional(),
  address: z.string().max(200).optional(),
  monthlyFee: z.number('Requerido').min(0),
  primaryColor: z.string().optional(),
});
export type SchoolForm = z.infer<typeof schoolSchema>;

export const userSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(30),
  displayName: z.string().min(2).max(80),
  role: z.enum(['admin', 'coach', 'parent']),
  password: z.string().min(6, 'Mínimo 6 caracteres').or(z.literal('')).optional(),
  active: z.boolean(),
});
export type UserForm = z.infer<typeof userSchema>;

/** setValueAs para inputs numéricos opcionales ("" → undefined). */
export const numOrUndef = {
  setValueAs: (v: unknown) => (v === '' || v == null || Number.isNaN(v) ? undefined : Number(v)),
};
