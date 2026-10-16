import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Skeleton ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800', className)} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

// ---------- Empty state ----------

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && <div className="text-zinc-300 dark:text-zinc-600">{icon}</div>}
      <p className="font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {message && <p className="max-w-sm text-sm text-zinc-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------- Avatar ----------

export function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };
  const ini = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-brand-200 dark:ring-brand-800',
          sizes[size],
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-semibold text-white ring-2 ring-brand-200 dark:ring-brand-800',
        sizes[size],
        className,
      )}
    >
      {ini || '?'}
    </div>
  );
}

// ---------- Progress ----------

export function Progress({
  value,
  tone = 'brand',
  className,
}: {
  value: number;
  tone?: 'brand' | 'gold' | 'red' | 'blue';
  className?: string;
}) {
  const colors = {
    brand: 'bg-brand-500',
    gold: 'bg-gold-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800', className)}>
      <div
        className={cn('h-full rounded-full transition-all', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ---------- Tabs ----------

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: ReactNode }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            active === t.key
              ? 'bg-white text-brand-700 shadow-sm dark:bg-zinc-900 dark:text-brand-300'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Búsqueda ----------

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30 dark:border-zinc-700 dark:bg-zinc-900"
      />
    </div>
  );
}

// ---------- Paginación ----------

export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-zinc-500 sm:text-sm">
      <span>
        Página {page} de {pages} · {total} registros
      </span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-zinc-300 p-1.5 disabled:opacity-40 dark:border-zinc-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-zinc-300 p-1.5 disabled:opacity-40 dark:border-zinc-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- Switch ----------

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm"
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
      {label}
    </button>
  );
}

// ---------- Encabezado de página ----------

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
