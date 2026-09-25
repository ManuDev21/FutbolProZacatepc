import { useOnline } from '@/hooks/useOnline';
import { cn } from '@/lib/utils';

export function ConnectionBadge() {
  const online = useOnline();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        online
          ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      )}
      title={online ? 'Conectado a Internet' : 'Sin conexión — la app sigue funcionando con datos locales'}
    >
      <span className={cn('h-2 w-2 rounded-full', online ? 'bg-brand-500' : 'bg-red-500')} />
      {online ? 'En línea' : 'Sin conexión'}
    </span>
  );
}
