import { db } from '@/db/database';
import { nowISO, uuid } from '@/lib/utils';
import type {
  CaorPlan,
  CaorPlanDay,
  CaorPlayerProfile,
  CaorPlay,
  CaorRivalReport,
  CaorTestCategory,
  CaorTestRecord,
} from '@/types';
import { createCrudService } from './base';
import { exercisesService } from './exercises.service';
import { auditService } from './audit.service';

const playsCrud = createCrudService(db.caor_plays, 'jugada-caor');
const plansCrud = createCrudService(db.caor_plans, 'planificacion-caor');
const rivalsCrud = createCrudService(db.caor_rivals, 'rival-caor');
const testsCrud = createCrudService(db.caor_tests, 'test-caor');
const profilesCrud = createCrudService(db.caor_profiles, 'perfil-caor');

export const DAYS_OF_WEEK: CaorPlanDay['day'][] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export function createEmptyWeekDays(): CaorPlanDay[] {
  return [
    { day: 'Lunes', focus: 'Activación + Técnica analítica', durationMin: 90, rpe: 5, playIds: [] },
    { day: 'Martes', focus: 'Posesión y presión tras pérdida', durationMin: 90, rpe: 7, playIds: [] },
    { day: 'Miércoles', focus: 'Táctica colectiva y transiciones', durationMin: 95, rpe: 8, playIds: [] },
    { day: 'Jueves', focus: 'Finalización y velocidad de reacción', durationMin: 85, rpe: 6, playIds: [] },
    { day: 'Viernes', focus: 'Balón parado y activación pre-partido', durationMin: 65, rpe: 4, playIds: [] },
    { day: 'Sábado', focus: 'Partido oficial / Competencia', durationMin: 90, rpe: 9, playIds: [] },
    { day: 'Domingo', focus: 'Descanso / Recuperación activa', durationMin: 0, rpe: 1, playIds: [] },
  ];
}

export interface CaorTestPreset {
  name: string;
  category: CaorTestCategory;
  unit: string;
  betterDirection: 'higher' | 'lower';
  benchmark: number;
  description: string;
}

export const CAOR_TEST_PRESETS: CaorTestPreset[] = [
  {
    name: 'Sprint 10m (Aceleración)',
    category: 'velocidad',
    unit: 'seg',
    betterDirection: 'lower',
    benchmark: 1.85,
    description: 'Tiempo de salida explosiva en 10 metros.',
  },
  {
    name: 'Sprint 30m (Velocidad lanzada)',
    category: 'velocidad',
    unit: 'seg',
    betterDirection: 'lower',
    benchmark: 4.35,
    description: 'Velocidad máxima en 30 metros.',
  },
  {
    name: 'Yo-Yo Intermittent Recovery Nivel 1',
    category: 'resistencia',
    unit: 'm',
    betterDirection: 'higher',
    benchmark: 1600,
    description: 'Capacidad aeróbica intermitente específica de fútbol.',
  },
  {
    name: 'Course Navette (Test de Léger)',
    category: 'resistencia',
    unit: 'palier',
    betterDirection: 'higher',
    benchmark: 11,
    description: 'Resistencia cardiorrespiratoria progresiva de 20m.',
  },
  {
    name: 'Salto Vertical CMJ',
    category: 'fuerza',
    unit: 'cm',
    betterDirection: 'higher',
    benchmark: 42,
    description: 'Potencia explosiva del tren inferior con contramovimiento.',
  },
  {
    name: 'Salto Horizontal sin impulso',
    category: 'fuerza',
    unit: 'cm',
    betterDirection: 'higher',
    benchmark: 215,
    description: 'Potencia horizontal de piernas.',
  },
  {
    name: 'Test de Agilidad Illinois',
    category: 'agilidad',
    unit: 'seg',
    betterDirection: 'lower',
    benchmark: 16.2,
    description: 'Cambios de dirección y giro con y sin balón.',
  },
  {
    name: 'T-Test de Cambio de Dirección',
    category: 'agilidad',
    unit: 'seg',
    betterDirection: 'lower',
    benchmark: 10.2,
    description: 'Desplazamiento frontal, lateral y retroceso.',
  },
  {
    name: 'Circuito Técnico de Pase y Control',
    category: 'tecnica',
    unit: 'pts',
    betterDirection: 'higher',
    benchmark: 85,
    description: 'Precisión de pase y control orientado sobre 100 puntos.',
  },
  {
    name: 'Precisión de Disparo a Zonas',
    category: 'tecnica',
    unit: 'pts',
    betterDirection: 'higher',
    benchmark: 80,
    description: 'Golpeo a ángulos de portería sobre 100 puntos.',
  },
];

export const caorPlaysService = {
  ...playsCrud,

  async toggleFavorite(id: string): Promise<void> {
    const p = await db.caor_plays.get(id);
    if (!p) return;
    await db.caor_plays.update(id, { favorite: !p.favorite, updatedAt: nowISO() });
  },

  async duplicate(id: string): Promise<CaorPlay | undefined> {
    const orig = await db.caor_plays.get(id);
    if (!orig) return undefined;
    const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = orig;
    return playsCrud.create({
      ...rest,
      title: `${orig.title} (copia)`,
      elements: orig.elements.map((e) => ({ ...e })),
      keyframes: orig.keyframes.map((k) => ({
        ...k,
        id: uuid(),
        positions: { ...k.positions },
        arrows: k.arrows ? k.arrows.map((a) => ({ ...a })) : [],
      })),
    });
  },

  /** Guarda una jugada/tarea CAOR también dentro del catálogo general de ejercicios. */
  async exportToExerciseLibrary(play: CaorPlay): Promise<void> {
    const playersCount = play.elements.filter(
      (e) => e.kind === 'player_own' || e.kind === 'player_rival' || e.kind === 'goalkeeper',
    ).length;
    const materials = Array.from(
      new Set(
        play.elements
          .filter((e) => !['player_own', 'player_rival', 'goalkeeper', 'coach'].includes(e.kind))
          .map((e) => {
            const map: Record<string, string> = {
              ball: 'balones',
              cone: 'conos',
              pole: 'picas',
              hurdle: 'vallas',
              ladder: 'escalera',
              ring: 'aros',
              mannequin: 'maniquíes',
              minigoal: 'mini porterías',
              zone: 'petos',
            };
            return map[e.kind] ?? e.kind;
          }),
      ),
    );
    await exercisesService.create({
      code: `CAOR-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      name: play.title,
      description: play.description || `Creado en Estudio CAOR (${play.keyframes.length} pasos animados).`,
      area: play.kind === 'ejercicio' ? 'tecnica' : 'tactica',
      difficulty: play.intensity === 'maxima' ? 5 : play.intensity === 'alta' ? 4 : 3,
      objective: play.objective || 'Tarea diseñada en Sistema Digital CAOR',
      durationMin: play.durationMin ?? 20,
      playersMin: Math.max(2, playersCount),
      playersMax: Math.max(4, playersCount + 4),
      materials: materials.length > 0 ? materials : ['balones', 'conos'],
      tags: play.tags.length > 0 ? play.tags : ['tactica', 'tecnica'],
      favorite: play.favorite,
      builtin: false,
    });
    await auditService.log('exportar-biblioteca', 'jugada-caor', play.id, play.title);
  },
};

export const caorPlansService = {
  ...plansCrud,

  async duplicate(id: string): Promise<CaorPlan | undefined> {
    const orig = await db.caor_plans.get(id);
    if (!orig) return undefined;
    const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = orig;
    return plansCrud.create({
      ...rest,
      title: `${orig.title} (copia)`,
      status: 'borrador',
      days: orig.days.map((d) => ({ ...d, playIds: [...d.playIds] })),
    });
  },
};

export const caorRivalsService = {
  ...rivalsCrud,

  async duplicate(id: string): Promise<CaorRivalReport | undefined> {
    const orig = await db.caor_rivals.get(id);
    if (!orig) return undefined;
    const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = orig;
    return rivalsCrud.create({
      ...rest,
      rivalName: `${orig.rivalName} (copia)`,
      keyPlayers: orig.keyPlayers.map((k) => ({ ...k, id: uuid() })),
      lineupSlots: orig.lineupSlots.map((s) => ({ ...s, id: uuid() })),
    });
  },
};

export const caorTestsService = {
  ...testsCrud,

  forPlayer(playerId: string): Promise<CaorTestRecord[]> {
    return db.caor_tests
      .where('playerId')
      .equals(playerId)
      .toArray()
      .then((a) => a.sort((x, y) => y.date.localeCompare(x.date)));
  },
};

export const caorProfilesService = {
  ...profilesCrud,

  async getOrCreateForPlayer(playerId: string): Promise<CaorPlayerProfile> {
    const existing = await db.caor_profiles.where('playerId').equals(playerId).first();
    if (existing) return existing;
    return profilesCrud.create({
      playerId,
      preferredFoot: 'derecho',
      secondaryPositions: [],
      tacticalRole: 'Polivalente',
      strengths: ['Compromiso táctico', 'Buena lectura de juego'],
      improvementGoals: ['Perfil orientado bajo presión'],
      customAttributes: [
        { label: 'Control orientado', value: 72 },
        { label: 'Pase entre líneas', value: 68 },
        { label: 'Toma de decisión', value: 75 },
        { label: '1 vs 1 ofensivo', value: 70 },
        { label: 'Duelos defensivos', value: 66 },
        { label: 'Resistencia al esfuerzo', value: 78 },
      ],
    });
  },
};
