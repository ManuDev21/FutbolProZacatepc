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
  { to: '/app/caor', label: 'Centro CAOR', icon: Sparkles, end: true },
  { to: '/app/caor/estudio', label: 'Estudio Táctico & Jugadas', icon: Play },
  { to: '/app/caor/planificaciones', label: 'Planificaciones', icon: CalendarRange },
  { to: '/app/caor/rival', label: 'Análisis del Rival', icon: Crosshair },
  { to: '/app/caor/test', label: 'Test Físicos/Técnicos', icon: Timer },
  { to: '/app/caor/jugadores', label: 'Jugadores CAOR', icon: Users },
  { to: '/app/caor/biblioteca', label: 'Mi Biblioteca', icon: BookMarked },
];

export function CaorSubnav() {
  return (
    <div className="mb-4 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-brand-200/80 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 p-1.5 shadow-sm dark:border-brand-900">
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gold-500/20 px-2.5 py-1.5 text-xs font-extrabold tracking-wider text-gold-400 uppercase">
        <Sparkles className="h-3.5 w-3.5" />
        CAOR Digital
      </div>
      <div className="flex items-center gap-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-gold-500 text-brand-950 shadow-sm'
                  : 'text-brand-100/85 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
