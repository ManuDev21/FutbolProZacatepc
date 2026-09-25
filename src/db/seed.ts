import { db } from '@/db/database';
import { nowISO, toISODate, toPeriod, uuid } from '@/lib/utils';
import type {
  Attendance,
  AttendanceStatus,
  Category,
  Coach,
  Evaluation,
  EventItem,
  FinanceMovement,
  Guardian,
  Lineup,
  Payment,
  PaymentStatus,
  Player,
  PlayerStatus,
  Training,
  TrainingLevel,
} from '@/types';
import { settingsService, SETTINGS_KEYS } from '@/services/settings.service';
import { authService } from '@/services/auth.service';
import { exercisesService } from '@/services/exercises.service';
import { defaultFormation, formationsFor } from '@/data/formations';

// ---------- Datos base ----------

const FIRST_NAMES = [
  'Mateo',
  'Santiago',
  'Leonardo',
  'Diego',
  'Emiliano',
  'Gael',
  'Thiago',
  'Damián',
  'Bruno',
  'Iker',
  'Sebastián',
  'Emiliano',
  'Ángel',
  'Josué',
  'Rodrigo',
  'Fernando',
  'Mauricio',
  'Alexis',
  'Ethan',
  'Dylan',
  'Camila',
  'Valentina',
  'Regina',
  'Ximena',
  'Fernanda',
  'Renata',
  'Mariana',
  'Daniela',
  'Sofía',
  'Luciana',
];

const LAST_NAMES = [
  'Hernández',
  'García',
  'Martínez',
  'López',
  'González',
  'Pérez',
  'Rodríguez',
  'Sánchez',
  'Ramírez',
  'Cruz',
  'Flores',
  'Morales',
  'Vázquez',
  'Reyes',
  'Jiménez',
  'Torres',
  'Díaz',
  'Gutiérrez',
  'Ruiz',
  'Mendoza',
];

const POSITIONS_7 = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];
const POSITIONS_11 = [
  'Portero',
  'Defensa central',
  'Lateral derecho',
  'Lateral izquierdo',
  'Mediocentro defensivo',
  'Mediocentro',
  'Extremo derecho',
  'Extremo izquierdo',
  'Delantero centro',
];

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry(20260925);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const rint = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

function birthDateFor(minAge: number, maxAge: number): string {
  const now = new Date();
  const age = rint(minAge, maxAge);
  const year = now.getFullYear() - age;
  const month = rint(0, 11);
  const day = rint(1, 28);
  return toISODate(new Date(year, month, day));
}

/** ¿La DB ya fue inicializada? */
export async function isDbInitialized(): Promise<boolean> {
  const flag = await settingsService.getSetting<boolean>(SETTINGS_KEYS.demoLoaded);
  const hasData = (await db.categories.count()) > 0 || (await db.users.count()) > 0;
  return Boolean(flag) || hasData;
}

/** Inicialización mínima (sin demo): usuarios + categorías base + escuela + ejercicios. */
export async function initEmpty(): Promise<void> {
  await authService.ensureDefaultUsers();
  await exercisesService.importLibrary();
  if (!(await settingsService.getSchool())) {
    await settingsService.saveSchool({
      name: 'Cañeros de Zacatepec — Escuela de Fútbol',
      whatsapp: '7771234567',
      phone: '7771234567',
      monthlyFee: 500,
      currency: 'MXN',
      primaryColor: '#177541',
    });
  }
  if ((await db.categories.count()) === 0) {
    const mk = (name: string, minAge: number, maxAge: number, format: 7 | 11): Category => ({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      name,
      minAge,
      maxAge,
      format,
      active: true,
    });
    await db.categories.bulkAdd([mk('Sub-7', 5, 8, 7), mk('Sub-13', 9, 14, 7), mk('Sub-17', 15, 18, 11)]);
  }
  await settingsService.setSetting(SETTINGS_KEYS.demoLoaded, false);
}

/** Carga completa de datos de demostración. */
export async function seedDemo(): Promise<void> {
  await authService.ensureDefaultUsers();
  await exercisesService.importLibrary();

  // Escuela
  await settingsService.saveSchool({
    name: 'Cañeros de Zacatepec — Escuela de Fútbol',
    whatsapp: '7771234567',
    phone: '7771234567',
    email: 'escuela@caneroszacatepec.mx',
    address: 'Unidad Deportiva Zacatepec, Morelos',
    monthlyFee: 500,
    currency: 'MXN',
    primaryColor: '#177541',
  });
  const school = (await settingsService.getSchool())!;

  // Categorías: Sub-7 y Sub-13 juegan Fútbol 7, Sub-17 juega Fútbol 11
  const mkCat = (name: string, minAge: number, maxAge: number, format: 7 | 11, desc: string): Category => ({
    id: uuid(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    name,
    minAge,
    maxAge,
    format,
    description: desc,
    active: true,
  });
  const categories: Category[] = [
    mkCat('Sub-7', 5, 8, 7, 'Iniciación y coordinación — Fútbol 7'),
    mkCat('Sub-13', 9, 14, 7, 'Formación técnica — Fútbol 7'),
    mkCat('Sub-17', 15, 18, 11, 'Alto rendimiento — Fútbol 11'),
  ];
  await db.categories.bulkAdd(categories);

  // Entrenadores
  const mkCoach = (firstName: string, lastName: string, specialty: string, catIds: string[]): Coach => ({
    id: uuid(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    firstName,
    lastName,
    phone: `777${rint(1000000, 9999999)}`,
    email: `${firstName.toLowerCase()}@caneroszacatepec.mx`,
    specialty,
    experienceYears: rint(3, 15),
    categoryIds: catIds,
    active: true,
  });
  const coaches: Coach[] = [
    mkCoach('Ricardo', 'Alonso', 'Técnica individual', [categories[0].id, categories[1].id]),
    mkCoach('Javier', 'Santillán', 'Preparación física', [categories[2].id]),
    mkCoach('Mauricio', 'Pineda', 'Táctica y sistemas', [categories[1].id, categories[2].id]),
    mkCoach('Óscar', 'Beltrán', 'Porteros', [categories[0].id, categories[1].id, categories[2].id]),
  ];
  await db.coaches.bulkAdd(coaches);

  // Jugadores + tutores (36 jugadores: 12 por categoría)
  const players: Player[] = [];
  const guardians: Guardian[] = [];
  const usedNames = new Set<string>();
  for (const cat of categories) {
    const positions = cat.format === 11 ? POSITIONS_11 : POSITIONS_7;
    for (let i = 0; i < 12; i++) {
      let firstName = pick(FIRST_NAMES);
      let lastName = `${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
      while (usedNames.has(`${firstName} ${lastName}`)) {
        firstName = pick(FIRST_NAMES);
        lastName = `${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
      }
      usedNames.add(`${firstName} ${lastName}`);

      const gFirst = pick(FIRST_NAMES);
      const gLast = lastName.split(' ')[0];
      const guardian: Guardian = {
        id: uuid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        firstName: gFirst,
        lastName: gLast,
        phone: `777${rint(1000000, 9999999)}`,
        whatsapp: `777${rint(1000000, 9999999)}`,
        email: `${gFirst.toLowerCase()}.${gLast.toLowerCase()}@correo.mx`,
        relationship: pick(['Padre', 'Madre', 'Tutor']),
        playerIds: [],
      };
      const status: PlayerStatus = rand() < 0.9 ? 'activo' : rand() < 0.5 ? 'lesionado' : 'inactivo';
      const player: Player = {
        id: uuid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        firstName,
        lastName,
        birthDate: birthDateFor(cat.minAge, cat.maxAge),
        categoryId: cat.id,
        position: positions[i % positions.length],
        jerseyNumber: i + 1,
        phone: `777${rint(1000000, 9999999)}`,
        status,
        joinedAt: toISODate(new Date(Date.now() - rint(60, 500) * 86400000)),
        guardianId: guardian.id,
      };
      guardian.playerIds.push(player.id);
      players.push(player);
      guardians.push(guardian);
    }
  }
  await db.players.bulkAdd(players);
  await db.guardians.bulkAdd(guardians);

  // Equipos
  for (const cat of categories) {
    const teamPlayers = players.filter((p) => p.categoryId === cat.id).slice(0, cat.format + 3);
    await db.teams.add({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      name: `Cañeros ${cat.name}`,
      categoryId: cat.id,
      coachId: coaches.find((c) => c.categoryIds.includes(cat.id))?.id,
      playerIds: teamPlayers.map((p) => p.id),
      active: true,
    });
  }

  // Entrenamientos de muestra
  const exercises = await db.exercises.limit(60).toArray();
  const levels: TrainingLevel[] = ['iniciacion', 'basico', 'intermedio', 'avanzado'];
  const trainings: Training[] = [];
  const today = new Date();
  for (let i = 0; i < 8; i++) {
    const cat = categories[i % categories.length];
    const date = new Date(today);
    date.setDate(today.getDate() + rint(-7, 7));
    const steps = Array.from({ length: rint(3, 5) }).map((_, si) => ({
      exerciseId: exercises[(i * 5 + si) % exercises.length].id,
      durationMin: rint(10, 25),
    }));
    trainings.push({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      name: `Sesión ${i + 1} — ${cat.name}`,
      categoryId: cat.id,
      coachId: coaches.find((c) => c.categoryIds.includes(cat.id))?.id,
      date: toISODate(date),
      objective: pick(['Posesión', 'Finalización', 'Presión alta', 'Transiciones', 'Balón parado']),
      level: pick(levels),
      steps,
    });
  }
  await db.trainings.bulkAdd(trainings);

  // Asistencias: últimas 6 sesiones por categoría
  const attendances: Attendance[] = [];
  const statusPool: AttendanceStatus[] = [
    'presente',
    'presente',
    'presente',
    'presente',
    'presente',
    'presente',
    'presente',
    'retardo',
    'ausente',
    'justificado',
  ];
  for (const cat of categories) {
    const catPlayers = players.filter((p) => p.categoryId === cat.id && p.status !== 'baja');
    for (let d = 0; d < 6; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d * 2);
      attendances.push({
        id: uuid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        date: toISODate(date),
        categoryId: cat.id,
        coachId: coaches.find((c) => c.categoryIds.includes(cat.id))?.id,
        records: catPlayers.map((p) => ({
          playerId: p.id,
          status: pick(statusPool),
          time: `${rint(16, 19)}:${pick(['00', '15', '30', '45'])}`,
        })),
      });
    }
  }
  await db.attendances.bulkAdd(attendances);

  // Pagos: 3 periodos por jugador activo
  const payments: Payment[] = [];
  const periods = [-2, -1, 0].map((offset) => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return toPeriod(d);
  });
  for (const p of players.filter((x) => x.status === 'activo')) {
    for (const period of periods) {
      const r = rand();
      const status: PaymentStatus =
        r < 0.55 ? 'pagado' : r < 0.75 ? 'pendiente' : r < 0.9 ? 'vencido' : 'parcial';
      const dueDate = `${period}-10`;
      const paid = status === 'pagado' || status === 'parcial';
      payments.push({
        id: uuid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        playerId: p.id,
        concept: 'Mensualidad',
        period,
        amount: school.monthlyFee,
        amountPaid: status === 'pagado' ? school.monthlyFee : status === 'parcial' ? 200 : undefined,
        dueDate,
        paidAt: paid ? `${period}-0${rint(1, 9)}` : undefined,
        method: paid ? pick(['efectivo', 'transferencia', 'tarjeta'] as const) : undefined,
        status,
      });
    }
    if (rand() < 0.4) {
      payments.push({
        id: uuid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        playerId: p.id,
        concept: 'Inscripción',
        amount: 800,
        amountPaid: 800,
        dueDate: p.joinedAt,
        paidAt: p.joinedAt,
        method: 'efectivo',
        status: 'pagado',
      });
    }
  }
  await db.payments.bulkAdd(payments);

  // Finanzas: reflejar cobros + gastos demo
  const movements: FinanceMovement[] = [];
  for (const p of payments.filter((x) => x.status === 'pagado' || x.status === 'parcial')) {
    movements.push({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      type: 'ingreso',
      concept: p.concept,
      categoryLabel: 'Mensualidades',
      amount: p.amountPaid ?? p.amount,
      date: p.paidAt ?? p.dueDate,
      method: p.method,
      paymentId: p.id,
    });
  }
  const expenseConcepts: [string, string][] = [
    ['Renta de cancha', 'Instalaciones'],
    ['Balones y material', 'Material deportivo'],
    ['Uniformes', 'Material deportivo'],
    ['Torneo regional', 'Torneos'],
    ['Arbitraje', 'Torneos'],
  ];
  for (let i = 0; i < 10; i++) {
    const [concept, cat] = pick(expenseConcepts);
    const d = new Date(today);
    d.setDate(today.getDate() - rint(1, 60));
    movements.push({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      type: 'gasto',
      concept,
      categoryLabel: cat,
      amount: rint(2, 30) * 100,
      date: toISODate(d),
      method: pick(['efectivo', 'transferencia'] as const),
    });
  }
  await db.finance.bulkAdd(movements);

  // Evaluaciones: 2 por jugador activo
  const evaluations: Evaluation[] = [];
  for (const p of players.filter((x) => x.status === 'activo')) {
    const base = rint(45, 75);
    for (const [period, offsetDays, boost] of [
      ['inicial', -60, 0],
      ['mensual', -25, rint(2, 10)],
    ] as const) {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      const score = (b: number) => Math.min(100, Math.max(20, b + rint(-8, 12)));
      evaluations.push({
        id: uuid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        playerId: p.id,
        date: toISODate(d),
        period,
        label: period === 'inicial' ? 'Evaluación inicial' : `Mensual ${toPeriod(d)}`,
        scores: {
          tecnica: score(base + boost),
          velocidad: score(base + boost),
          tactica: score(base + boost - 5),
          fisico: score(base + boost),
          actitud: score(base + 10),
        },
      });
    }
  }
  await db.evaluations.bulkAdd(evaluations);

  // Eventos de calendario
  const eventTypes: [EventItem['type'], string][] = [
    ['entrenamiento', 'Entrenamiento'],
    ['partido', 'Partido amistoso'],
    ['torneo', 'Torneo local'],
    ['reunion', 'Reunión de padres'],
  ];
  for (let i = 0; i < 12; i++) {
    const [type, label] = pick(eventTypes);
    const d = new Date(today);
    d.setDate(today.getDate() + rint(-10, 20));
    const cat = pick(categories);
    await db.events.add({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      title: `${label} — ${cat.name}`,
      type,
      date: toISODate(d),
      time: `${rint(16, 19)}:00`,
      location: pick(['Cancha principal', 'Unidad Deportiva', 'Cancha 2']),
      categoryId: cat.id,
    });
  }

  // Alineaciones demo (una por categoría)
  for (const cat of categories) {
    const formation = defaultFormation(cat.format);
    const slots = formationsFor(cat.format)[formation];
    const roster = players
      .filter((p) => p.categoryId === cat.id && p.status === 'activo')
      .slice(0, slots.length);
    const lineup: Lineup = {
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      categoryId: cat.id,
      name: `Titular ${formation}`,
      formation,
      format: cat.format,
      slots: slots.map((s, i) => ({ ...s, playerId: roster[i]?.id })),
      notes: 'Alineación base de demostración',
    };
    await db.lineups.add(lineup);
  }

  await settingsService.setSetting(SETTINGS_KEYS.demoLoaded, true);
}
