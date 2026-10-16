import {
  LayoutDashboard,
  Users,
  Layers,
  ClipboardCheck,
  CreditCard,
  Wallet,
  Dumbbell,
  CalendarDays,
  ClipboardList,
  FileText,
  Settings,
  Bell,
  UsersRound,
  ContactRound,
  Shield,
  Goal,
  Trophy,
  Sparkles,
  Play,
  CalendarRange,
  Crosshair,
  Timer,
  BookMarked,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  /** Sección lógica para control de acceso `can()` */
  area: string;
  group: 'principal' | 'caor' | 'deportivo' | 'administracion' | 'sistema';
  badge?: string;
}

const ALL: Role[] = ['admin', 'coach', 'parent'];
const ADMIN: Role[] = ['admin'];
const ADMIN_COACH: Role[] = ['admin', 'coach'];

export const CAOR_NAV_ITEMS: NavItem[] = [
  {
    to: '/app/caor',
    label: 'Resumen CAOR',
    icon: Sparkles,
    roles: ADMIN_COACH,
    area: 'caor',
    group: 'caor',
  },
  {
    to: '/app/caor/estudio',
    label: 'Estudio Táctico',
    icon: Play,
    roles: ADMIN_COACH,
    area: 'caor',
    group: 'caor',
  },
  {
    to: '/app/caor/planificaciones',
    label: 'Planificaciones',
    icon: CalendarRange,
    roles: ADMIN_COACH,
    area: 'caor',
    group: 'caor',
  },
  {
    to: '/app/caor/rival',
    label: 'Análisis del Rival',
    icon: Crosshair,
    roles: ADMIN_COACH,
    area: 'caor',
    group: 'caor',
  },
  {
    to: '/app/caor/test',
    label: 'Tests Físicos',
    icon: Timer,
    roles: ADMIN_COACH,
    area: 'caor',
    group: 'caor',
  },
  {
    to: '/app/caor/jugadores',
    label: 'Ficha Jugadores',
    icon: Users,
    roles: ADMIN_COACH,
    area: 'caor',
    group: 'caor',
  },
  {
    to: '/app/caor/biblioteca',
    label: 'Mi Biblioteca',
    icon: BookMarked,
    roles: ADMIN_COACH,
    area: 'caor',
    group: 'caor',
  },
];

export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Panel', icon: LayoutDashboard, roles: ALL, area: 'dashboard', group: 'principal' },
  {
    to: '/app/jugadores',
    label: 'Jugadores',
    icon: Users,
    roles: ALL,
    area: 'jugadores',
    group: 'principal',
  },
  {
    to: '/app/asistencias',
    label: 'Asistencias',
    icon: ClipboardCheck,
    roles: ADMIN_COACH,
    area: 'asistencias',
    group: 'principal',
  },
  { to: '/app/pagos', label: 'Pagos', icon: CreditCard, roles: ADMIN, area: 'pagos', group: 'principal' },
  {
    to: '/app/calendario',
    label: 'Calendario',
    icon: CalendarDays,
    roles: ALL,
    area: 'calendario',
    group: 'principal',
  },

  {
    to: '/app/entrenamientos',
    label: 'Entrenamientos',
    icon: Dumbbell,
    roles: ADMIN_COACH,
    area: 'entrenamientos',
    group: 'deportivo',
  },
  {
    to: '/app/ejercicios',
    label: 'Biblioteca',
    icon: Trophy,
    roles: ADMIN_COACH,
    area: 'ejercicios',
    group: 'deportivo',
  },
  {
    to: '/app/pizarra',
    label: 'Pizarra táctica',
    icon: Goal,
    roles: ADMIN_COACH,
    area: 'pizarra',
    group: 'deportivo',
  },
  {
    to: '/app/evaluaciones',
    label: 'Evaluaciones',
    icon: ClipboardList,
    roles: ADMIN_COACH,
    area: 'evaluaciones',
    group: 'deportivo',
  },
  {
    to: '/app/reportes',
    label: 'Reportes',
    icon: FileText,
    roles: ADMIN_COACH,
    area: 'reportes',
    group: 'deportivo',
  },

  {
    to: '/app/categorias',
    label: 'Categorías',
    icon: Layers,
    roles: ADMIN,
    area: 'categorias',
    group: 'administracion',
  },
  {
    to: '/app/entrenadores',
    label: 'Entrenadores',
    icon: ContactRound,
    roles: ADMIN,
    area: 'entrenadores',
    group: 'administracion',
  },
  {
    to: '/app/tutores',
    label: 'Padres/Tutores',
    icon: UsersRound,
    roles: ADMIN,
    area: 'tutores',
    group: 'administracion',
  },
  {
    to: '/app/equipos',
    label: 'Equipos',
    icon: Shield,
    roles: ADMIN,
    area: 'equipos',
    group: 'administracion',
  },
  {
    to: '/app/finanzas',
    label: 'Finanzas',
    icon: Wallet,
    roles: ADMIN,
    area: 'finanzas',
    group: 'administracion',
  },

  {
    to: '/app/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
    roles: ADMIN_COACH,
    area: 'notificaciones',
    group: 'sistema',
  },
  {
    to: '/app/configuracion',
    label: 'Configuración',
    icon: Settings,
    roles: ADMIN,
    area: 'configuracion',
    group: 'sistema',
  },
];

export const GROUP_LABELS: Record<NavItem['group'], string> = {
  principal: 'Principal',
  caor: 'Sistema Digital CAOR',
  deportivo: 'Área deportiva',
  administracion: 'Administración',
  sistema: 'Sistema',
};

/** Items visibles en la barra inferior móvil. */
export const BOTTOM_NAV: NavItem[] = [
  NAV_ITEMS[0], // Panel
  NAV_ITEMS[1], // Jugadores
  NAV_ITEMS[2], // Asistencias
  NAV_ITEMS[3], // Pagos
];
