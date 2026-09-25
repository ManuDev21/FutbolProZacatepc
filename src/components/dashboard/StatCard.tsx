import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/misc';

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'brand',
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'brand' | 'gold' | 'red' | 'blue' | 'dark';
  onClick?: () => void;
}) {
  const tones = {
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    dark: 'bg-zinc-800 text-white dark:bg-zinc-700',
  };
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Card className={cn('p-4', onClick && 'cursor-pointer transition-shadow hover:shadow-md')}>
      <Wrapper onClick={onClick} className="flex w-full items-center gap-3 text-left">
        <span className={cn('rounded-xl p-2.5', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-zinc-500">{label}</p>
          <p className="truncate text-xl font-bold tracking-tight">{value}</p>
          {sub && <p className="truncate text-[11px] text-zinc-400">{sub}</p>}
        </div>
      </Wrapper>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="flex items-center gap-3 p-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
    </Card>
  );
}
