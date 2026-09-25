import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Pencil, Trash2, Eye } from 'lucide-react';
import { useCategories, useGuardians, usePlayers } from '@/hooks/useData';
import { playersService } from '@/services/players.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { useAuthStore } from '@/stores/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { EmptyState, PageHeader, Pagination, SearchInput, Avatar, TableSkeleton } from '@/components/ui/misc';
import { PlayerFormModal } from '@/components/players/PlayerFormModal';
import { calcAge, fullName, matchesSearch } from '@/lib/utils';
import type { Player } from '@/types';
import type { PlayerForm } from '@/lib/validators';

const PAGE_SIZE = 12;

export default function PlayersPage() {
  const players = usePlayers();
  const categories = useCategories();
  const guardians = useGuardians();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const readOnly = role === 'parent';

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'nombre' | 'edad' | 'ingreso'>('nombre');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; player?: Player | null }>({ open: false });

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const filtered = useMemo(() => {
    let list = players ?? [];
    if (search.trim())
      list = list.filter((p) => matchesSearch([p.firstName, p.lastName, p.position], search));
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    if (status) list = list.filter((p) => p.status === status);
    list = [...list].sort((a, b) => {
      if (sort === 'nombre') return fullName(a).localeCompare(fullName(b), 'es');
      if (sort === 'edad') return calcAge(a.birthDate) - calcAge(b.birthDate);
      return b.joinedAt.localeCompare(a.joinedAt);
    });
    return list;
  }, [players, search, categoryId, status, sort]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = async (data: PlayerForm & { photo?: string }) => {
    try {
      if (modal.player) {
        await playersService.update(modal.player.id, data);
        toast.success('Jugador actualizado', fullName(modal.player));
      } else {
        await playersService.create(data as Omit<Player, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Jugador creado correctamente');
      }
    } catch {
      toast.error('No se pudo guardar el jugador');
      throw new Error();
    }
  };

  const remove = async (p: Player) => {
    const ok = await confirmDialog({
      title: 'Eliminar jugador',
      message: `¿Estás seguro de eliminar a ${fullName(p)}? Se conservan sus pagos y evaluaciones históricas.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    await playersService.remove(p.id);
    toast.success('Jugador eliminado', fullName(p));
  };

  return (
    <div>
      <PageHeader
        title="Jugadores"
        subtitle={`${filtered.length} registrado(s)`}
        actions={
          !readOnly && (
            <Button onClick={() => setModal({ open: true, player: null })}>
              <Plus className="h-4 w-4" /> Nuevo jugador
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Buscar por nombre o posición..."
            className="min-w-52 flex-1"
          />
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">Todas las categorías</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="lesionado">Lesionados</option>
            <option value="inactivo">Inactivos</option>
            <option value="baja">Bajas</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-36">
            <option value="nombre">Nombre A-Z</option>
            <option value="edad">Edad</option>
            <option value="ingreso">Más recientes</option>
          </Select>
        </div>

        {!players ? (
          <TableSkeleton />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="No existen jugadores registrados"
            message={
              search || categoryId || status
                ? 'Prueba con otros filtros.'
                : 'Registra tu primer jugador para comenzar.'
            }
            action={
              !readOnly &&
              !search && (
                <Button size="sm" onClick={() => setModal({ open: true, player: null })}>
                  <Plus className="h-4 w-4" /> Nuevo jugador
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Jugador</Th>
                  <Th>Categoría</Th>
                  <Th>Edad</Th>
                  <Th>Posición</Th>
                  <Th>Núm.</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </THead>
              <TBody>
                {pageItems.map((p) => (
                  <Tr
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/app/jugadores/${p.id}`)}
                  >
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={p.photo} name={fullName(p)} size="sm" />
                        <span className="font-medium">{fullName(p)}</span>
                      </div>
                    </Td>
                    <Td>{catName.get(p.categoryId ?? '') ?? <Badge>—</Badge>}</Td>
                    <Td>{calcAge(p.birthDate)} años</Td>
                    <Td className="text-zinc-500">{p.position ?? '—'}</Td>
                    <Td>
                      {p.jerseyNumber != null && (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-100 text-xs font-bold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                          {p.jerseyNumber}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                    <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/app/jugadores/${p.id}`)}
                          title="Ver perfil"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setModal({ open: true, player: p })}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(p)} title="Eliminar">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </Card>

      <PlayerFormModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        player={modal.player}
        categories={categories}
        guardians={guardians}
        onSubmit={save}
      />
    </div>
  );
}
