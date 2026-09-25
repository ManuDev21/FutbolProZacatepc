import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "2026-09" a partir de una fecha */
export function toPeriod(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, 1);
  const label = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(iso?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate.length === 10 ? `${birthDate}T12:00:00` : birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function initials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export function fullName(p?: { firstName: string; lastName: string } | null): string {
  if (!p) return '—';
  return `${p.firstName} ${p.lastName}`.trim();
}

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesSearch(haystack: (string | undefined | null)[], query: string): boolean {
  if (!query.trim()) return true;
  const q = normalize(query);
  return haystack.some((h) => h && normalize(h).includes(q));
}

export function downloadFile(content: string | Blob, filename: string, mime = 'application/json') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const k = key(item);
      (acc[k] ??= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function sortBy<T>(items: T[], ...keys: ((a: T, b: T) => number)[]): T[] {
  return [...items].sort((a, b) => {
    for (const k of keys) {
      const r = k(a, b);
      if (r !== 0) return r;
    }
    return 0;
  });
}
