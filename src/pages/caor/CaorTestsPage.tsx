import { useMemo, useState } from 'react';
import { Timer, Plus, Trash2, Trophy, CheckCircle2 } from 'lucide-react';
import { CaorSubnav } from '@/components/caor/CaorSubnav';
import { useCaorTests, useCategories, usePlayers } from '@/hooks/useData';
import { CAOR_TEST_PRESETS, caorTestsService } from '@/services/caor.service';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { Avatar, EmptyState, PageHeader } from '@/components/ui/misc';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { formatDate, fullName, todayISO } from '@/lib/utils';
import type { CaorTestCategory, CaorTestRecord } from '@/types';

const CATEGORY_LABELS: Record<CaorTestCategory, string> = {
  velocidad: 'Velocidad',
  resistencia: 'Resistencia',
  fuerza: 'Fuerza Explosiva',
  agilidad: 'Agilidad / COD',
  tecnica: 'Técnica con balón',
  personalizado: 'Personalizado',
};

export default function CaorTestsPage() {
  const tests = useCaorTests();
  const players = usePlayers();
  const categories = useCategories();

  const [filterTestName, setFilterTestName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario de nuevo test (soporta preset o 100% personalizado)
  const [presetIdx, setPresetIdx] = useState<string>('0');
  const [playerId, setPlayerId] = useState('');
  const [testName, setTestName] = useState(CAOR_TEST_PRESETS[0].name);
  const [testCategory, setTestCategory] = useState<CaorTestCategory>(CAOR_TEST_PRESETS[0].category);
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState(String(CAOR_TEST_PRESETS[0].benchmark));
  const [unit, setUnit] = useState(CAOR_TEST_PRESETS[0].unit);
  const [betterDirection, setBetterDirection] = useState<'higher' | 'lower'>(
    CAOR_TEST_PRESETS[0].betterDirection,
  );
  const [benchmark, setBenchmark] = useState(String(CAOR_TEST_PRESETS[0].benchmark));
  const [notes, setNotes] = useState('');

  const playerMap = useMemo(() => new Map((players ?? []).map((p) => [p.id, p])), [players]);
  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const distinctTestNames = useMemo(
    () => Array.from(new Set((tests ?? []).map((t) => t.testName))),
    [tests],
  );

  const filtered = useMemo(() => {
    let list = tests ?? [];
    if (filterTestName) list = list.filter((t) => t.testName === filterTestName);
    if (filterCategory) {
      list = list.filter((t) => {
        const p = playerMap.get(t.playerId);
        return p?.categoryId === filterCategory;
      });
    }
    if (filterTestName && list.length > 1) {
      const dir = list[0].betterDirection;
      return [...list].sort((a, b) => (dir === 'lower' ? a.value - b.value : b.value - a.value));
    }
    return list;
  }, [tests, filterTestName, filterCategory, playerMap]);

  const applyPreset = (idxStr: string) => {
    setPresetIdx(idxStr);
    if (idxStr === 'custom') {
      setTestName('');
      setTestCategory('personalizado');
      setUnit('pts');
      setBetterDirection('higher');
      setBenchmark('80');
      return;
    }
    const preset = CAOR_TEST_PRESETS[Number(idxStr)];
    if (!preset) return;
    setTestName(preset.name);
    setTestCategory(preset.category);
    setUnit(preset.unit);
    setBetterDirection(preset.betterDirection);
    setBenchmark(String(preset.benchmark));
    setValue(String(preset.benchmark));
  };

  const openNew = () => {
    setPlayerId(players?.[0]?.id ?? '');
    applyPreset('0');
    setDate(todayISO());
    setNotes('');
    setModalOpen(true);
  };

  const saveTest = async () => {
    if (!playerId) {
      toast.warning('Selecciona un jugador');
      return;
    }
    if (!testName.trim()) {
      toast.warning('Escribe el nombre del test');
      return;
    }
    const numVal = Number(value);
    if (Number.isNaN(numVal)) {
      toast.warning('Ingresa un resultado numérico válido');
      return;
    }
    const player = playerMap.get(playerId);
    await caorTestsService.create({
      playerId,
      categoryId: player?.categoryId,
      testName: testName.trim(),
      testCategory,
      date,
      value: numVal,
      unit: unit.trim() || 'pts',
      betterDirection,
      benchmark: benchmark ? Number(benchmark) : undefined,
      notes: notes.trim() || undefined,
    });
    toast.success('Test registrado', `${testName}: ${numVal} ${unit}`);
    setModalOpen(false);
  };

  const removeTest = async (t: CaorTestRecord) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar registro de test',
        message: `¿Eliminar "${t.testName}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await caorTestsService.remove(t.id);
    toast.success('Test eliminado');
  };

  return (
    <div className="space-y-6">
      <CaorSubnav />

      <PageHeader
        title="Tests Físicos y Técnicos"
        subtitle="Batería de pruebas condicionales y técnicas con ranking automático y marcas objetivo"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Registrar Test
          </Button>
        }
      />

      {/* Catálogo visual de baterías de test con más espacio */}
      <Card>
        <CardHeader
          title="Baterías de evaluación disponibles"
          subtitle="Selecciona una prueba para filtrar el ranking o registrar una medición rápida"
        />
        <CardBody className="p-5">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {CAOR_TEST_PRESETS.map((pr, idx) => (
              <div
                key={pr.name}
                onClick={() =>
                  setFilterTestName((curr) => (curr === pr.name ? '' : pr.name))
                }
                className={`cursor-pointer rounded-xl border p-3.5 text-xs transition ${
                  filterTestName === pr.name
                    ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40'
                    : 'border-zinc-200 hover:border-brand-400 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <Badge tone="green">{CATEGORY_LABELS[pr.category]}</Badge>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Meta: {pr.benchmark} {pr.unit}
                  </span>
                </div>
                <p className="mt-2.5 font-bold text-zinc-800 dark:text-zinc-100">{pr.name}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">{pr.description}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlayerId(players?.[0]?.id ?? '');
                    applyPreset(String(idx));
                    setModalOpen(true);
                  }}
                  className="mt-3 text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                >
                  Evaluar esta prueba
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Tabla de resultados / Ranking */}
      <Card>
        <div className="flex flex-col gap-2.5 border-b border-zinc-100 p-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-zinc-800">
          <Select
            value={filterTestName}
            onChange={(e) => setFilterTestName(e.target.value)}
            className="w-full sm:w-72"
          >
            <option value="">Todas las pruebas (orden cronológico)</option>
            {distinctTestNames.map((n) => (
              <option key={n} value={n}>
                Ranking: {n}
              </option>
            ))}
          </Select>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="">Todas las categorías</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Timer className="h-10 w-10" />}
            title="Sin mediciones registradas"
            message="Registra el primer test de velocidad, salto, resistencia o técnica para ver el ranking."
            action={
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4" /> Registrar Test
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                {filterTestName && <Th>#</Th>}
                <Th>Jugador</Th>
                <Th>Prueba</Th>
                <Th>Área</Th>
                <Th>Resultado</Th>
                <Th>Meta / Estado</Th>
                <Th>Fecha</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((t, idx) => {
                const p = playerMap.get(t.playerId);
                const achievesBenchmark =
                  t.benchmark != null
                    ? t.betterDirection === 'lower'
                      ? t.value <= t.benchmark
                      : t.value >= t.benchmark
                    : null;
                return (
                  <Tr key={t.id}>
                    {filterTestName && (
                      <Td>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/20 text-xs font-black text-amber-700 dark:text-gold-400">
                          {idx + 1}
                        </span>
                      </Td>
                    )}
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={p?.photo} name={p ? fullName(p) : '?'} size="sm" />
                        <div>
                          <p className="font-semibold">{p ? fullName(p) : '—'}</p>
                          <p className="text-[11px] text-zinc-400">
                            {catName.get(p?.categoryId ?? '') ?? ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-medium">{t.testName}</Td>
                    <Td>
                      <Badge tone="blue">{CATEGORY_LABELS[t.testCategory]}</Badge>
                    </Td>
                    <Td>
                      <span className="font-mono text-sm font-black text-brand-700 dark:text-brand-300">
                        {t.value} {t.unit}
                      </span>
                    </Td>
                    <Td>
                      {t.benchmark != null ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                            achievesBenchmark
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {achievesBenchmark ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Trophy className="h-3.5 w-3.5" />
                          )}
                          Meta {t.benchmark} {t.unit}
                        </span>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td className="text-zinc-500">{formatDate(t.date)}</Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeTest(t)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Modal registrar test */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Test Físico / Técnico CAOR"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTest}>Guardar resultado</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Jugador" required>
              <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                <option value="">Seleccionar jugador...</option>
                {(players ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {fullName(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha de evaluación" required>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Plantilla de prueba (o elige 100% Personalizado)">
            <Select value={presetIdx} onChange={(e) => applyPreset(e.target.value)}>
              {CAOR_TEST_PRESETS.map((pr, idx) => (
                <option key={pr.name} value={String(idx)}>
                  {pr.name} ({pr.unit})
                </option>
              ))}
              <option value="custom">Crear Test 100% Personalizado...</option>
            </Select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nombre del Test" required className="sm:col-span-2">
              <Input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Ej. Sprint 20m con balón"
              />
            </Field>
            <Field label="Categoría">
              <Select
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value as CaorTestCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Resultado obtenido" required>
              <Input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
            <Field label="Unidad de medida">
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="seg, cm, m, pts..."
              />
            </Field>
            <Field label="Marca objetivo (Benchmark)">
              <Input
                type="number"
                step="0.01"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Criterio de mejora">
              <Select
                value={betterDirection}
                onChange={(e) => setBetterDirection(e.target.value as 'higher' | 'lower')}
              >
                <option value="higher">Mayor valor es mejor (cm, metros, puntos)</option>
                <option value="lower">Menor valor es mejor (segundos en sprint/agilidad)</option>
              </Select>
            </Field>
            <Field label="Observaciones">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Superficie, clima, estado físico..."
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
