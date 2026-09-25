import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications, useUnreadCount } from '@/hooks/useData';
import { notificationsService } from '@/services/notifications.service';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const KIND_TONE: Record<string, string> = {
  pago: 'bg-gold-500',
  asistencia: 'bg-blue-500',
  evaluacion: 'bg-purple-500',
  entrenamiento: 'bg-brand-500',
  sistema: 'bg-zinc-500',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const notifications = useNotifications();
  const unread = useUnreadCount() ?? 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            <p className="text-sm font-semibold">Notificaciones</p>
            <button
              onClick={() => notificationsService.markAllRead()}
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar leídas
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin notificaciones</p>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    notificationsService.markRead(n.id);
                    if (n.link) navigate(n.link);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800',
                    !n.read && 'bg-brand-50/60 dark:bg-brand-900/10',
                  )}
                >
                  <span
                    className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', KIND_TONE[n.kind] ?? 'bg-zinc-400')}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{n.title}</span>
                    <span className="block truncate text-xs text-zinc-500">{n.message}</span>
                    <span className="text-[10px] text-zinc-400">{formatDateTime(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => {
              navigate('/app/notificaciones');
              setOpen(false);
            }}
            className="w-full border-t border-zinc-100 py-2 text-center text-xs font-medium text-brand-600 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Ver todas
          </button>
        </div>
      )}
    </div>
  );
}
