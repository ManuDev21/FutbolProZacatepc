import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'green' | 'gold' | 'red' | 'blue' | 'gray' | 'outline';

const tones: Record<Tone, string> = {
  green: 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200',
  gold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  gray: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  outline: 'border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
};

export function Badge({
  tone = 'gray',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Badges de dominio frecuentes. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    activo: { tone: 'green', label: 'Activo' },
    lesionado: { tone: 'gold', label: 'Lesionado' },
    inactivo: { tone: 'gray', label: 'Inactivo' },
    baja: { tone: 'red', label: 'Baja' },
    pagado: { tone: 'green', label: 'Pagado' },
    pendiente: { tone: 'gold', label: 'Pendiente' },
    vencido: { tone: 'red', label: 'Vencido' },
    parcial: { tone: 'blue', label: 'Parcial' },
    presente: { tone: 'green', label: 'Presente' },
    ausente: { tone: 'red', label: 'Ausente' },
    retardo: { tone: 'gold', label: 'Retardo' },
    justificado: { tone: 'blue', label: 'Justificado' },
  };
  const s = map[status] ?? { tone: 'gray' as Tone, label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
