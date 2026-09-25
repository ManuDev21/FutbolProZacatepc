import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, RefreshCw, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useData';
import { notificationsService } from '@/services/notifications.service';
import { paymentsService } from '@/services/payments.service';
import { db } from '@/db/database';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { cn, formatDateTime } from '@/lib/utils';

const KIND_LABEL: Record<string, { label: string; tone: 'green' | 'gold' | 'red' | 'blue' | 'gray' }> = {
  pago: { label: 'Pagos', tone: 'gold' },
  asistencia: { label: 'Asistencia', tone: 'blue' },
  evaluacion: { label: 'Evaluaciones', tone: 'blue' },
  entrenamiento: { label: 'Entrenamientos', tone: 'green' },
  sistema: { label: 'Sistema', tone: 'gray' },
};

export default function NotificationsPage() {
  const notifications = useNotifications();
  const navigate = useNavigate();

  const recompute = async () => {
    await paymentsService.refreshOverdue();
    await notificationsService.recompute();
    toast.success('Notificaciones actualizadas');
  };

  const clearAll = async () => {
    if (
      !(await confirmDialog({
        title: 'Limpiar notificaciones',
        message: 'Se eliminarán todas las notificaciones locales. ¿Continuar?',
        confirmLabel: 'Limpiar',
        danger: true,
      }))
    )
      return;
    await db.notifications.clear();
    toast.success('Notificaciones eliminadas');
  };

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        subtitle="Alertas internas generadas desde tus datos locales"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={recompute}>
              <RefreshCw className="h-4 w-4" /> Recalcular
            </Button>
            <Button variant="secondary" size="sm" onClick={() => notificationsService.markAllRead()}>
              <CheckCheck className="h-4 w-4" /> Marcar leídas
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 text-red-500" /> Limpiar
            </Button>
          </>
        }
      />
      <Card>
        <CardBody className="p-0">
          {!notifications || notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-10 w-10" />}
              title="Sin notificaciones"
              message="Las alertas de pagos vencidos, evaluaciones pendientes y entrenamientos próximos aparecerán aquí."
            />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      notificationsService.markRead(n.id);
                      if (n.link) navigate(n.link);
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                      !n.read && 'bg-brand-50/50 dark:bg-brand-900/10',
                    )}
                  >
                    <Badge tone={KIND_LABEL[n.kind]?.tone ?? 'gray'}>
                      {KIND_LABEL[n.kind]?.label ?? n.kind}
                    </Badge>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{n.title}</span>
                      <span className="block text-xs text-zinc-500">{n.message}</span>
                      <span className="text-[10px] text-zinc-400">{formatDateTime(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
