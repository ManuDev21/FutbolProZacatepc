import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun, Download, X, ChevronDown, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { can } from '@/stores/auth';
import { NAV_ITEMS, CAOR_NAV_ITEMS, GROUP_LABELS, BOTTOM_NAV } from './nav';
import { ConnectionBadge } from './ConnectionBadge';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { notificationsService } from '@/services/notifications.service';
import { paymentsService } from '@/services/payments.service';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role;
  const [caorOpen, setCaorOpen] = useState(true);

  const canSeeCaor = role && can(role, 'caor');
  const isInsideCaor = location.pathname.startsWith('/app/caor');

  const groups = (['principal', 'deportivo', 'administracion', 'sistema'] as const)
    .map((g) => ({
      group: g,
      items: NAV_ITEMS.filter((i) => i.group === g && role && i.roles.includes(role) && can(role, i.area)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <img src="/logo.svg" alt="Cañeros Zacatepec" className="h-10 w-10 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">FútbolPro</p>
          <p className="truncate text-xs font-medium text-brand-300">Zacatepec · Cañeros</p>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {/* Sección desplegable Sistema Digital CAOR con la misma paleta sobria del sidebar */}
        {canSeeCaor && (
          <div>
            <p className="px-2 pb-1 text-[10px] font-bold tracking-widest text-brand-300/70 uppercase">
              Módulos Avanzados
            </p>
            <button
              type="button"
              onClick={() => setCaorOpen((o) => !o)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                isInsideCaor
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-brand-100/80 hover:bg-white/10 hover:text-white',
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Sparkles className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">Sistema CAOR</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-100">
                  Nuevo
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 text-brand-200 transition-transform', caorOpen && 'rotate-180')}
                />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {caorOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 ml-3 space-y-0.5 border-l border-white/15 pl-2.5">
                    {CAOR_NAV_ITEMS.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/app/caor'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-white/15 font-semibold text-white'
                              : 'text-brand-100/75 hover:bg-white/10 hover:text-white',
                          )
                        }
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.group}>
            <p className="px-2 pb-1 text-[10px] font-bold tracking-widest text-brand-300/70 uppercase">
              {GROUP_LABELS[g.group]}
            </p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/15 text-white shadow-inner'
                        : 'text-brand-100/80 hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 px-2 pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-brand-950">
            {user?.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user?.displayName}</p>
            <p className="text-[10px] text-brand-300 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InstallButton() {
  const installPrompt = useUiStore((s) => s.installPrompt);
  const setInstallPrompt = useUiStore((s) => s.setInstallPrompt);
  if (!installPrompt) return null;
  return (
    <button
      onClick={async () => {
        const e = installPrompt as unknown as { prompt: () => Promise<void> };
        await e.prompt();
        setInstallPrompt(null);
      }}
      className="hidden items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-gold-400 sm:inline-flex"
    >
      <Download className="h-3.5 w-3.5" /> Instalar app
    </button>
  );
}

export function AppLayout() {
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme } = useUiStore();
  const user = useAuthStore((s) => s.user);

  // Recalcular notificaciones y pagos vencidos al montar el layout
  useEffect(() => {
    paymentsService
      .refreshOverdue()
      .then(() => notificationsService.recompute())
      .catch(() => {});
  }, []);

  const bottomItems = BOTTOM_NAV.filter(
    (i) => user?.role && i.roles.includes(user.role) && can(user.role, i.area),
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 bg-brand-800 lg:block dark:bg-brand-950">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil (drawer) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 bg-brand-800 lg:hidden dark:bg-brand-950"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2.5 sm:gap-4 sm:px-5 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden min-w-0 flex-1 sm:block">
            <GlobalSearch />
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ConnectionBadge />
            <InstallButton />
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* Búsqueda móvil */}
        <div className="border-b border-zinc-200 bg-white px-3 py-2 sm:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <GlobalSearch />
        </div>

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-5 lg:pb-5">
          <Outlet />
        </main>

        {/* Bottom nav móvil */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-500',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-zinc-500"
          >
            <MoreHorizontal className="h-5 w-5" />
            Más
          </button>
        </nav>
      </div>
    </div>
  );
}
