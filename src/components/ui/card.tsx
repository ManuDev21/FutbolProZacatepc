import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-w-0 max-w-full rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 p-4', className)} {...rest} />;
}
