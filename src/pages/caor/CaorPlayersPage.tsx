import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2, Save, Eye } from 'lucide-react';
import { CaorSubnav } from '@/components/caor/CaorSubnav';
import { useCaorProfiles, useCaorTests, useCategories, usePlayers } from '@/hooks/useData';
import { caorProfilesService } from '@/services/caor.service';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Avatar, EmptyState, PageHeader, SearchInput } from '@/components/ui/misc';
import { toast } from '@/stores/toast';
import { calcAge, fullName, matchesSearch } from '@/lib/utils';
import type { CaorPlayerProfile, Player } from '@/types';

export default function CaorPlayersPage() {
  const navigate = useNavigate();
  const players = usePlayers();
  const categories = useCategories();
  const profiles = useCaorProfiles();
  const allTests = useCaorTests();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [profile, setProfile] = useState<CaorPlayerProfile | null>(null);
  const [newAttrLabel, setNewAttrLabel] = useState('');

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const filteredPlayers = useMemo(() => {
    let list = players ?? [];
    if (search.trim()) list = list.filter((p) => matchesSearch([p.firstName, p.lastName, p.position], search));
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    return list;
  }, [players, search, categoryId]);

  const activePlayer: Player | undefined = useMemo(() => {
    if (!filteredPlayers.length) return undefined;
    return filteredPlayers.find((p) => p.id === selectedPlayerId) ?? filteredPlayers[0];
  }, [filteredPlayers, selectedPlayerId]);

  useEffect(() => {
    if (!activePlayer) {
      setProfile(null);
      return;
    }
    const existing = (profiles ?? []).find((pr) => pr.playerId === activePlayer.id);
    if (existing) {
      setProfile({
        ...existing,
        strengths: [...existing.strengths],
        improvementGoals: [...existing.improvementGoals],
        secondaryPositions: [...existing.secondaryPositions],
        customAttributes: existing.customAttributes.map((a) => ({ ...a })),
      });
    } else {
      caorProfilesService.getOrCreateForPlayer(activePlayer.id).then((created) => {
        setProfile(created);
      });
    }
  }, [activePlayer, profiles]);

  const playerTests = useMemo(
    () => (allTests ?? []).filter((t) => t.playerId === activePlayer?.id).slice(0, 6),
    [allTests, activePlayer],
  );

  const saveProfile = async () => {
    if (!profile) return;
    const { id, createdAt: _c, updatedAt: _u, ...rest } = profile;
    await caorProfilesService.update(id, rest);
    toast.success('Ficha técnica CAOR guardada', activePlayer ? fullName(activePlayer) : undefined);
  };

  const addCustomAttribute = () => {
    if (!profile || !newAttrLabel.trim()) return;
    setProfile({
      ...profile,
      customAttributes: [...profile.customAttributes, { label: newAttrLabel.trim(), value: 70 }],
    });
    setNewAttrLabel('');
  };

  return (
    <div className="space-y-6">
      <CaorSubnav />

      <PageHeader
        title="Ficha Técnica de Jugadores"
        subtitle="Atributos personalizables por el entrenador, perfil dominante, rol táctico y plan individual"
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/jugadores')}>
            <Users className="h-4 w-4" /> Gestionar Plantilla
          </Button>
        }
      />

      {!players || players.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="No hay jugadores registrados aún"
            message="Registra primero tus jugadores en el módulo Jugadores para configurar su Ficha Técnica."
            action={
              <Button size="sm" onClick={() => navigate('/app/jugadores')}>
                Ir a Jugadores
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Selector lateral de jugadores */}
          <Card className="h-fit">
            <div className="space-y-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar jugador..." />
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Todas las categorías</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="max-h-56 divide-y divide-zinc-100 overflow-y-auto lg:max-h-[65vh] dark:divide-zinc-800">
              {filteredPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
                    activePlayer?.id === p.id
                      ? 'bg-brand-50 font-semibold dark:bg-brand-950/40'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Avatar src={p.photo} name={fullName(p)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{fullName(p)}</p>
                    <p className="text-[11px] text-zinc-400">
                      {catName.get(p.categoryId ?? '') ?? 'Sin cat.'} · {p.position ?? '—'}
                    </p>
                  </div>
                  {p.jerseyNumber != null && (
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs font-bold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                      #{p.jerseyNumber}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Ficha técnica CAOR del jugador activo */}
          {activePlayer && profile && (
            <div className="space-y-4">
              <Card>
                <CardHeader
                  title={fullName(activePlayer)}
                  subtitle={`${catName.get(activePlayer.categoryId ?? '') ?? 'Sin categoría'} · ${calcAge(activePlayer.birthDate)} años · Posición base: ${activePlayer.position ?? 'Por definir'}`}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={activePlayer.status} />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/app/jugadores/${activePlayer.id}`)}
                      >
                        <Eye className="h-4 w-4" /> Perfil administrativo
                      </Button>
                      <Button size="sm" onClick={saveProfile}>
                        <Save className="h-4 w-4" /> Guardar ficha CAOR
                      </Button>
                    </div>
                  }
                />
                <CardBody className="space-y-5 p-4 sm:p-5">
                  {/* Datos antropométricos y perfil táctico */}
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Field label="Pie hábil / Perfil">
                      <Select
                        value={profile.preferredFoot}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            preferredFoot: e.target.value as CaorPlayerProfile['preferredFoot'],
                          })
                        }
                      >
                        <option value="derecho">Diestro</option>
                        <option value="izquierdo">Zurdo</option>
                        <option value="ambidiestro">Ambidiestro</option>
                      </Select>
                    </Field>
                    <Field label="Rol táctico CAOR">
                      <Input
                        value={profile.tacticalRole ?? ''}
                        onChange={(e) => setProfile({ ...profile, tacticalRole: e.target.value })}
                        placeholder="Ej. Interior llegador, Central corrector..."
                      />
                    </Field>
                    <Field label="Estatura (cm)">
                      <Input
                        type="number"
                        value={profile.heightCm ?? ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            heightCm: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="168"
                      />
                    </Field>
                    <Field label="Peso (kg)">
                      <Input
                        type="number"
                        value={profile.weightKg ?? ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            weightKg: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="58"
                      />
                    </Field>
                  </div>

                  {/* Atributos 100% editables y personalizables */}
                  <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          Atributos Personalizados (0 – 100)
                        </p>
                        <p className="text-xs text-zinc-500">
                          Agrega, renombra o ajusta cualquier métrica específica para este jugador
                        </p>
                      </div>
                      <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Input
                          value={newAttrLabel}
                          onChange={(e) => setNewAttrLabel(e.target.value)}
                          placeholder="Nuevo atributo (ej. Juego aéreo)..."
                          className="min-w-0 flex-1 py-1.5 text-xs sm:w-56"
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={addCustomAttribute}>
                          <Plus className="h-3.5 w-3.5" /> Añadir
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile.customAttributes.map((attr, idx) => (
                        <div
                          key={idx}
                          className="space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-2">
                            <Input
                              value={attr.label}
                              onChange={(e) => {
                                const next = [...profile.customAttributes];
                                next[idx] = { ...attr, label: e.target.value };
                                setProfile({ ...profile, customAttributes: next });
                              }}
                              className="min-w-0 flex-1 py-1 text-xs font-semibold"
                            />
                            <span className="shrink-0 rounded-md bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                              {attr.value}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setProfile({
                                  ...profile,
                                  customAttributes: profile.customAttributes.filter((_, i) => i !== idx),
                                })
                              }
                              className="shrink-0 rounded p-1 text-zinc-400 hover:text-red-500"
                              title="Eliminar atributo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={attr.value}
                            onChange={(e) => {
                              const next = [...profile.customAttributes];
                              next[idx] = { ...attr, value: Number(e.target.value) };
                              setProfile({ ...profile, customAttributes: next });
                            }}
                            className="h-2 w-full cursor-pointer accent-brand-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fortalezas, objetivos y plan individual */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Fortalezas competitivas (separadas por coma)">
                      <Input
                        value={profile.strengths.join(', ')}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            strengths: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </Field>
                    <Field label="Objetivos de mejora individual (separados por coma)">
                      <Input
                        value={profile.improvementGoals.join(', ')}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            improvementGoals: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Plan de Desarrollo Individual (PDI)">
                    <Textarea
                      rows={3}
                      value={profile.individualPlan ?? ''}
                      onChange={(e) => setProfile({ ...profile, individualPlan: e.target.value })}
                      placeholder="Tareas específicas post-entrenamiento, consignas de videoanálisis..."
                    />
                  </Field>

                  {/* Tests recientes del jugador */}
                  <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-500 uppercase">
                        Tests Físicos/Técnicos recientes de {activePlayer.firstName}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/app/caor/test')}>
                        Ir a Módulo de Tests
                      </Button>
                    </div>
                    {playerTests.length === 0 ? (
                      <p className="text-xs text-zinc-400">
                        Sin tests registrados para este jugador.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {playerTests.map((t) => (
                          <Badge key={t.id} tone="green">
                            {t.testName}: {t.value} {t.unit}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
