import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Plus,
  Play,
  Copy,
  Trash2,
  Star,
  Folder,
  Download,
  Upload,
  BookPlus,
} from 'lucide-react';
import { CaorSubnav } from '@/components/caor/CaorSubnav';
import { useCaorPlays, useCategories } from '@/hooks/useData';
import { caorPlaysService } from '@/services/caor.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, SearchInput } from '@/components/ui/misc';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { cn, downloadFile, matchesSearch, toISODate } from '@/lib/utils';
import type { CaorPlay } from '@/types';

const KIND_LABELS: Record<CaorPlay['kind'], string> = {
  jugada: 'Jugada Táctica',
  ejercicio: 'Ejercicio Cancha',
  balon_parado: 'Balón Parado (ABP)',
  automatismo: 'Automatismo',
};

export default function CaorLibraryPage() {
  const navigate = useNavigate();
  const plays = useCaorPlays();
  const categories = useCategories();

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedKind, setSelectedKind] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of plays ?? []) {
      const f = p.folder || 'General';
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [plays]);

  const filtered = useMemo(() => {
    let list = plays ?? [];
    if (search.trim()) {
      list = list.filter((p) =>
        matchesSearch([p.title, p.folder, p.objective, p.description, ...p.tags], search),
      );
    }
    if (selectedFolder) list = list.filter((p) => (p.folder || 'General') === selectedFolder);
    if (selectedKind) list = list.filter((p) => p.kind === selectedKind);
    if (onlyFav) list = list.filter((p) => p.favorite);
    return list;
  }, [plays, search, selectedFolder, selectedKind, onlyFav]);

  const exportLibraryJson = () => {
    if (!plays || plays.length === 0) {
      toast.info('No hay jugadas en tu biblioteca para exportar');
      return;
    }
    downloadFile(
      JSON.stringify({ app: 'caor-library', exportedAt: new Date().toISOString(), items: plays }, null, 2),
      `biblioteca-caor-${toISODate(new Date())}.json`,
    );
    toast.success('Biblioteca CAOR exportada');
  };

  const importLibraryJson = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { items?: CaorPlay[] };
      if (!Array.isArray(parsed.items)) {
        toast.error('Archivo no válido');
        return;
      }
      let count = 0;
      for (const item of parsed.items) {
        if (!item.title || !Array.isArray(item.elements)) continue;
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item;
        await caorPlaysService.create(rest);
        count++;
      }
      toast.success(`${count} jugadas/ejercicios importados a tu Biblioteca CAOR`);
    } catch {
      toast.error('Error al importar el archivo JSON');
    }
  };

  const removePlay = async (p: CaorPlay) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar de Mi Biblioteca CAOR',
        message: `¿Eliminar "${p.title}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await caorPlaysService.remove(p.id);
    toast.success('Eliminado de tu biblioteca');
  };

  return (
    <div className="space-y-6">
      <CaorSubnav />

      <PageHeader
        title="Mi Biblioteca"
        subtitle="Colecciones personalizadas de tus jugadas animadas, ejercicios, automatismos y balón parado"
        actions={
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" size="sm" onClick={exportLibraryJson}>
              <Download className="h-4 w-4" /> Exportar Biblioteca
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Importar JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => importLibraryJson(e.target.files?.[0])}
            />
            <Button size="sm" onClick={() => navigate('/app/caor/estudio')}>
              <Plus className="h-4 w-4" /> Crear en Estudio Táctico
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Panel lateral de Carpetas / Colecciones */}
        <Card className="h-fit p-3">
          <p className="px-2 pb-2 text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
            Mis Carpetas ({folders.length})
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedFolder('')}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition',
                selectedFolder === ''
                  ? 'bg-brand-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
              )}
            >
              <span className="flex items-center gap-2">
                <Folder className="h-4 w-4" /> Todas las colecciones
              </span>
              <span>{plays?.length ?? 0}</span>
            </button>
            {folders.map(([folderName, count]) => (
              <button
                key={folderName}
                type="button"
                onClick={() => setSelectedFolder(folderName)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition',
                  selectedFolder === folderName
                    ? 'bg-brand-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate">{folderName}</span>
                </span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Listado y tarjetas de jugadas / ejercicios */}
        <div>
          <Card className="mb-4 flex flex-col gap-2.5 p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre, carpeta, objetivo o etiqueta..."
              className="w-full sm:min-w-52 sm:flex-1"
            />
            <div className="flex items-center gap-2">
              <Select
                value={selectedKind}
                onChange={(e) => setSelectedKind(e.target.value)}
                className="min-w-0 flex-1 sm:w-44 sm:flex-none"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(KIND_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setOnlyFav((f) => !f)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold',
                  onlyFav
                    ? 'border-gold-500 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-gold-400'
                    : 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300',
                )}
              >
                <Star className={cn('h-4 w-4', onlyFav && 'fill-gold-500 text-gold-500')} /> Favoritos
              </button>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BookMarked className="h-10 w-10" />}
                title="Tu Biblioteca CAOR está vacía con estos filtros"
                message="Diseña jugadas animadas, ejercicios o rutinas de balón parado en el Estudio CAOR y guárdalas aquí."
                action={
                  <Button size="sm" onClick={() => navigate('/app/caor/estudio')}>
                    <Plus className="h-4 w-4" /> Ir al Estudio CAOR
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <Card key={p.id} className="flex flex-col justify-between overflow-hidden">
                  {/* Mini vista previa esquemática de la cancha */}
                  <div>
                    <div
                      onClick={() => navigate(`/app/caor/estudio?id=${p.id}`)}
                      className="relative aspect-16/9 w-full cursor-pointer overflow-hidden"
                      style={{
                        background:
                          'repeating-linear-gradient(90deg, #177541 0 12.5%, #126534 12.5% 25%)',
                      }}
                    >
                      <svg viewBox="0 0 160 90" className="pointer-events-none absolute inset-0 h-full w-full">
                        <g stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" fill="none">
                          <rect x="4" y="4" width="152" height="82" />
                          <line x1="80" y1="4" x2="80" y2="86" />
                          <circle cx="80" cy="45" r="11" />
                        </g>
                      </svg>
                      {p.elements.slice(0, 22).map((el) => (
                        <div
                          key={el.id}
                          style={{
                            left: `${el.x * 100}%`,
                            top: `${el.y * 100}%`,
                            backgroundColor: el.kind === 'ball' ? '#ffffff' : el.color,
                          }}
                          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow"
                        />
                      ))}
                      <div className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Play className="h-3 w-3" /> {p.keyframes.length} pasos · {p.elements.length} elem.
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge tone="green">{KIND_LABELS[p.kind]}</Badge>
                            <Badge tone="gray">{p.folder}</Badge>
                            {p.categoryId && (
                              <Badge tone="blue">{catName.get(p.categoryId) ?? ''}</Badge>
                            )}
                          </div>
                          <h3 className="mt-2 font-bold text-sm">{p.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => caorPlaysService.toggleFavorite(p.id)}
                          className="rounded p-1 text-zinc-400 hover:text-gold-500"
                        >
                          <Star className={cn('h-4 w-4', p.favorite && 'fill-gold-500 text-gold-500')} />
                        </button>
                      </div>

                      {p.objective && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{p.objective}</p>
                      )}

                      {p.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/app/caor/estudio?id=${p.id}`)}
                    >
                      <Play className="h-3.5 w-3.5" /> Abrir y Reproducir
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Enviar al catálogo general de Ejercicios"
                        onClick={async () => {
                          await caorPlaysService.exportToExerciseLibrary(p);
                          toast.success('Añadido al catálogo de Ejercicios');
                        }}
                      >
                        <BookPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Duplicar"
                        onClick={async () => {
                          await caorPlaysService.duplicate(p.id);
                          toast.success('Jugada duplicada');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Eliminar"
                        onClick={() => removePlay(p)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
