import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Play,
  CalendarRange,
  Crosshair,
  Timer,
  Users,
  BookMarked,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/app/caor', label: 'Resumen', icon: Sparkles, end: true },
  { to: '/app/caor/estudio', label: 'Estudio Táctico', icon: Play },
  { to: '/app/caor/planificaciones', label: 'Planificaciones', icon: CalendarRange },
  { to: '/app/caor/rival', label: 'Análisis del Rival', icon: Crosshair },
  { to: '/app/caor/test', label: 'Tests Físicos', icon: Timer },
  { to: '/app/caor/jugadores', label: 'Ficha Jugadores', icon: Users },
  { to: '/app/caor/biblioteca', label: 'Mi Biblioteca', icon: BookMarked },
];

export function CaorSubnav() {
  return (
    <nav className="mb-5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:items-center">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white',
              )
            }
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
