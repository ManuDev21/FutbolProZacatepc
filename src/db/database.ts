import Dexie, { type EntityTable } from 'dexie';
import type {
  AuditLog,
  Attendance,
  CaorPlan,
  CaorPlayerProfile,
  CaorPlay,
  CaorRivalReport,
  CaorTestRecord,
  Category,
  Coach,
  Evaluation,
  EventItem,
  Exercise,
  FinanceMovement,
  Guardian,
  Lineup,
  NotificationItem,
  Payment,
  Player,
  ReportRecord,
  School,
  Setting,
  Team,
  Training,
  User,
} from '@/types';

/**
 * futbolprozacatepec_db — persistencia 100% local en IndexedDB.
 * Nunca acceder directamente desde componentes: usar servicios.
 */
export class FutbolProDB extends Dexie {
  settings!: EntityTable<Setting, 'id'>;
  users!: EntityTable<User, 'id'>;
  schools!: EntityTable<School, 'id'>;
  coaches!: EntityTable<Coach, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  players!: EntityTable<Player, 'id'>;
  guardians!: EntityTable<Guardian, 'id'>;
  teams!: EntityTable<Team, 'id'>;
  attendances!: EntityTable<Attendance, 'id'>;
  trainings!: EntityTable<Training, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  evaluations!: EntityTable<Evaluation, 'id'>;
  payments!: EntityTable<Payment, 'id'>;
  finance!: EntityTable<FinanceMovement, 'id'>;
  notifications!: EntityTable<NotificationItem, 'id'>;
  reports!: EntityTable<ReportRecord, 'id'>;
  events!: EntityTable<EventItem, 'id'>;
  audit_logs!: EntityTable<AuditLog, 'id'>;
  lineups!: EntityTable<Lineup, 'id'>;
  caor_plays!: EntityTable<CaorPlay, 'id'>;
  caor_plans!: EntityTable<CaorPlan, 'id'>;
  caor_rivals!: EntityTable<CaorRivalReport, 'id'>;
  caor_tests!: EntityTable<CaorTestRecord, 'id'>;
  caor_profiles!: EntityTable<CaorPlayerProfile, 'id'>;

  constructor() {
    super('futbolprozacatepec_db');
    this.version(1).stores({
      settings: 'id, key',
      users: 'id, username, role',
      schools: 'id',
      coaches: 'id, lastName, active',
      categories: 'id, name, active',
      players: 'id, lastName, categoryId, status, guardianId',
      guardians: 'id, lastName',
      teams: 'id, categoryId, coachId',
      attendances: 'id, date, categoryId, trainingId',
      trainings: 'id, date, categoryId, coachId',
      exercises: 'id, code, difficulty, favorite, builtin',
      evaluations: 'id, playerId, date, [playerId+date]',
      payments: 'id, playerId, status, period, dueDate, [playerId+status]',
      finance: 'id, type, date',
      notifications: 'id, key, read, kind',
      reports: 'id, kind, playerId',
      events: 'id, date, type, categoryId',
      audit_logs: 'id, entity, action',
      lineups: 'id, categoryId',
    });
    // v2: índices usados por orderBy en listados
    this.version(2).stores({
      categories: 'id, name, active, minAge',
      notifications: 'id, key, read, kind, createdAt',
      reports: 'id, kind, playerId, createdAt',
      audit_logs: 'id, entity, action, createdAt',
    });
    // v3: Sistema Digital CAOR
    this.version(3).stores({
      caor_plays: 'id, kind, folder, categoryId, favorite, createdAt',
      caor_plans: 'id, cycleType, categoryId, status, startDate, createdAt',
      caor_rivals: 'id, rivalName, categoryId, matchDate, createdAt',
      caor_tests: 'id, playerId, categoryId, testName, testCategory, date',
      caor_profiles: 'id, playerId',
    });
  }
}

export const db = new FutbolProDB();
