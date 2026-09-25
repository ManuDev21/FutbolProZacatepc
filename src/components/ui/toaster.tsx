import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type ToastKind } from '@/stores/toast';
import { cn } from '@/lib/utils';

const icons: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const tones: Record<ToastKind, string> = {
  success: 'border-brand-500 text-brand-600 dark:text-brand-300',
  error: 'border-red-500 text-red-600 dark:text-red-400',
  info: 'border-blue-500 text-blue-600 dark:text-blue-400',
  warning: 'border-gold-500 text-amber-600 dark:text-amber-400',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-[min(92vw,22rem)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 bg-white p-3 shadow-lg dark:bg-zinc-900',
                tones[t.kind],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</p>
                {t.message && <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
