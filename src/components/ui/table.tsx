import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ children, className }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-left text-sm', className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
      {children}
    </thead>
  );
}

export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-2.5 whitespace-nowrap', className)} {...rest} />;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>;
}

export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40', className)} {...rest} />
  );
}

export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-2.5 align-middle', className)} {...rest} />;
}
