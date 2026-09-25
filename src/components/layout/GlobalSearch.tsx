import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Layers, CreditCard, Dumbbell, ClipboardList } from 'lucide-react';
import { db } from '@/db/database';
import { useDebounce } from '@/hooks/useDebounce';
import { matchesSearch } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Result {
  id: string;
  kind: string;
  label: string;
  sub?: string;
  link: string;
}

const KIND_ICON: Record<string, typeof User> = {
  Jugador: User,
  Categoría: Layers,
  Pago: CreditCard,
  Entrenamiento: Dumbbell,
  Evaluación: ClipboardList,
  Entrenador: User,
};

/** Búsqueda global instantánea sobre IndexedDB. */
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(query, 200);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [players, coaches, categories, payments, trainings, evaluations] = await Promise.all([
        db.players.toArray(),
        db.coaches.toArray(),
        db.categories.toArray(),
        db.payments.toArray(),
        db.trainings.toArray(),
        db.evaluations.toArray(),
      ]);
      const r: Result[] = [];
      for (const p of players) {
        if (matchesSearch([p.firstName, p.lastName, p.position], debounced))
          r.push({
            id: p.id,
            kind: 'Jugador',
            label: `${p.firstName} ${p.lastName}`,
            sub: p.position,
            link: `/app/jugadores/${p.id}`,
          });
      }
      for (const c of coaches) {
        if (matchesSearch([c.firstName, c.lastName, c.specialty], debounced))
          r.push({
            id: c.id,
            kind: 'Entrenador',
            label: `${c.firstName} ${c.lastName}`,
            sub: c.specialty,
            link: '/app/entrenadores',
          });
      }
      for (const c of categories) {
        if (matchesSearch([c.name, c.description], debounced))
          r.push({
            id: c.id,
            kind: 'Categoría',
            label: c.name,
            sub: `F${c.format}`,
            link: '/app/categorias',
          });
      }
      const playerName = (id: string) => {
        const p = players.find((x) => x.id === id);
        return p ? `${p.firstName} ${p.lastName}` : '';
      };
      for (const p of payments) {
        if (matchesSearch([p.concept, p.period, playerName(p.playerId)], debounced))
          r.push({
            id: p.id,
            kind: 'Pago',
            label: `${p.concept} — ${playerName(p.playerId)}`,
            sub: p.period,
            link: '/app/pagos',
          });
      }
      for (const t of trainings) {
        if (matchesSearch([t.name, t.objective], debounced))
          r.push({
            id: t.id,
            kind: 'Entrenamiento',
            label: t.name,
            sub: t.date,
            link: '/app/entrenamientos',
          });
      }
      for (const e of evaluations) {
        if (matchesSearch([e.label, playerName(e.playerId)], debounced))
          r.push({
            id: e.id,
            kind: 'Evaluación',
            label: `${e.label ?? e.period} — ${playerName(e.playerId)}`,
            link: `/app/jugadores/${e.playerId}`,
          });
      }
      if (!cancelled) {
        setResults(r.slice(0, 12));
        setActiveIdx(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const grouped = useMemo(() => {
    const g = new Map<string, Result[]>();
    for (const r of results) {
      const arr = g.get(r.kind) ?? [];
      arr.push(r);
      g.set(r.kind, arr);
    }
    return [...g.entries()];
  }, [results]);

  const go = (r: Result) => {
    setOpen(false);
    setQuery('');
    navigate(r.link);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && results[activeIdx]) go(results[activeIdx]);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIdx((i) => Math.min(results.length - 1, i + 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIdx((i) => Math.max(0, i - 1));
            }
          }}
          placeholder="Buscar jugadores, pagos, entrenamientos..."
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      {open && query.trim() && (
        <div className="absolute top-11 left-0 z-40 max-h-96 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">Sin resultados</p>
          ) : (
            grouped.map(([kind, items]) => {
              const Icon = KIND_ICON[kind] ?? Search;
              return (
                <div key={kind}>
                  <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    {kind}
                  </p>
                  {items.map((r) => {
                    const idx = results.indexOf(r);
                    return (
                      <button
                        key={r.id}
                        onClick={() => go(r)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800',
                          idx === activeIdx && 'bg-brand-50 dark:bg-brand-900/20',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-brand-600" />
                        <span className="min-w-0 flex-1 truncate">{r.label}</span>
                        {r.sub && <span className="text-xs text-zinc-400">{r.sub}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
