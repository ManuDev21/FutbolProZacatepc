import { useMemo, useState } from 'react';
import { FileDown, FileText, Printer, Search, Share2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCategories, usePlayers, usePlayerStats } from '@/hooks/useData';
import { buildPlayerReportPdf, deliverPdf } from '@/services/reports.service';
import { db } from '@/db/database';
import { toast } from '@/stores/toast';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Avatar, EmptyState, PageHeader } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { calcAge, formatDateTime, fullName, matchesSearch } from '@/lib/utils';
import { SearchInput } from '@/components/ui/misc';
import type { Player } from '@/types';

export default function ReportsPage() {
  const players = usePlayers();
  const categories = useCategories();
  const reports = useLiveQuery(
    () =>
      db.reports
        .toArray()
        .then((a) => a.sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 30)),
    [],
  );

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selected, setSelected] = useState<Player | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const stats = usePlayerStats(selected?.id);

  const filtered = useMemo(() => {
    let list = players ?? [];
    if (search.trim()) list = list.filter((p) => matchesSearch([p.firstName, p.lastName], search));
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    return [...list].sort((a, b) => fullName(a).localeCompare(fullName(b), 'es'));
  }, [players, search, categoryId]);

  const generate = async (mode: 'save' | 'print' | 'share') => {
    if (!selected) return;
    setBusy(mode);
    try {
      const doc = await buildPlayerReportPdf(selected);
      const filename = `reporte-${selected.firstName}-${selected.lastName}.pdf`
        .replace(/\s+/g, '-')
        .toLowerCase();
      if (mode === 'print') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } else {
        await deliverPdf(doc, filename, mode === 'share');
      }
      toast.success('Reporte generado', filename);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo generar el PDF');
    } finally {
      setBusy(null);
    }
  };

  const catName = (id?: string) => categories?.find((c) => c.id === id)?.name ?? '—';

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle="PDF generado 100% en el navegador — nada se envía a servidores"
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Selector de jugador */}
        <Card>
          <CardHeader title="Seleccionar jugador" />
          <CardBody>
            <div className="flex gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." className="flex-1" />
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-32">
                <option value="">Todas</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelected(p)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selected?.id === p.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-zinc-100 hover:border-brand-300 dark:border-zinc-800'
                    }`}
                  >
                    <Avatar src={p.photo} name={fullName(p)} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium">{fullName(p)}</span>
                    <span className="text-[11px] text-zinc-400">{catName(p.categoryId)}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-400">Sin resultados</p>
              )}
            </ul>
          </CardBody>
        </Card>

        {/* Vista previa + acciones */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Reporte de jugador"
              subtitle="Incluye: ficha, asistencia, pagos, evaluaciones y radar de rendimiento"
            />
            <CardBody>
              {!selected ? (
                <EmptyState
                  icon={<FileText className="h-10 w-10" />}
                  title="Elige un jugador"
                  message="El PDF incluirá su ficha, estadísticas de asistencia, historial de pagos y evaluaciones con gráfica de radar."
                />
              ) : (
                <div>
                  <div className="flex flex-wrap items-center gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                    <Avatar src={selected.photo} name={fullName(selected)} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{fullName(selected)}</p>
                      <p className="text-xs text-zinc-500">
                        {catName(selected.categoryId)} · {calcAge(selected.birthDate)} años ·{' '}
                        {selected.position ?? '—'}
                      </p>
                      {stats && (
                        <p className="mt-1 text-xs text-zinc-400">
                          Asistencia {stats.attendance.porcentaje}% · {stats.payments.vencidos} pagos vencidos
                          · {stats.payments.pendientes} pendientes
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => generate('save')} loading={busy === 'save'}>
                      <FileDown className="h-4 w-4" /> Descargar PDF
                    </Button>
                    <Button variant="secondary" onClick={() => generate('print')} loading={busy === 'print'}>
                      <Printer className="h-4 w-4" /> Imprimir
                    </Button>
                    <Button variant="secondary" onClick={() => generate('share')} loading={busy === 'share'}>
                      <Share2 className="h-4 w-4" /> Compartir
                    </Button>
                  </div>
                  <p className="mt-3 text-[11px] text-zinc-400">
                    "Compartir" usa la Web Share API cuando el dispositivo lo permite.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Reportes generados" subtitle="Historial local" />
            <CardBody className="p-0">
              {!reports || reports.length === 0 ? (
                <EmptyState title="Aún no se generan reportes" icon={<Search className="h-8 w-8" />} />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Reporte</Th>
                      <Th>Tipo</Th>
                      <Th>Fecha</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {reports.map((r) => (
                      <Tr key={r.id}>
                        <Td className="font-medium">{r.label}</Td>
                        <Td className="capitalize text-zinc-500">{r.kind}</Td>
                        <Td className="text-zinc-500">{formatDateTime(r.createdAt)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
