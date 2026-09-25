import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, FileDown, MessageCircle, Share2, Printer } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  usePlayer,
  usePlayerStats,
  useCategories,
  useGuardians,
  usePayments,
  useEvaluations,
  useAttendances,
} from '@/hooks/useData';
import { playersService } from '@/services/players.service';
import { buildPlayerReportPdf, deliverPdf } from '@/services/reports.service';
import { paymentReminderMessage, openWhatsApp } from '@/services/whatsapp.service';
import { calcAge, formatCurrency, formatDate, fullName, periodLabel } from '@/lib/utils';
import { Avatar, EmptyState, PageHeader, Progress } from '@/components/ui/misc';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { PlayerFormModal } from '@/components/players/PlayerFormModal';
import { toast } from '@/stores/toast';
import { useAuthStore } from '@/stores/auth';
import type { PlayerForm } from '@/lib/validators';

const EVAL_KEYS = [
  ['tecnica', 'Técnica'],
  ['velocidad', 'Velocidad'],
  ['tactica', 'Táctica'],
  ['fisico', 'Físico'],
  ['actitud', 'Actitud'],
] as const;

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const readOnly = role === 'parent';
  const player = usePlayer(id);
  const stats = usePlayerStats(id);
  const categories = useCategories();
  const guardians = useGuardians();
  const payments = usePayments();
  const evaluations = useEvaluations(id);
  const attendances = useAttendances();
  const [editOpen, setEditOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<'save' | 'share' | 'print' | null>(null);

  if (player === undefined) return null;
  if (player === null || !player) {
    return (
      <EmptyState
        title="Jugador no encontrado"
        action={<Button onClick={() => navigate('/app/jugadores')}>Volver</Button>}
      />
    );
  }

  const category = categories?.find((c) => c.id === player.categoryId);
  const guardian = guardians?.find((g) => g.id === player.guardianId);
  const playerPayments = (payments ?? []).filter((p) => p.playerId === player.id);
  const playerAttendance = (attendances ?? [])
    .map((a) => ({ a, rec: a.records.find((r) => r.playerId === player.id) }))
    .filter((x) => x.rec)
    .slice(0, 10);

  const radarData = EVAL_KEYS.map(([k, label]) => {
    const cur = evaluations?.at(-1);
    const prev = evaluations?.at(-2);
    return {
      area: label,
      actual: cur?.scores[k] ?? 0,
      anterior: prev?.scores[k] ?? 0,
    };
  });

  const evolutionData = (evaluations ?? []).map((e) => ({
    fecha: formatDate(e.date, { day: '2-digit', month: 'short' }),
    ...e.scores,
  }));

  const genPdf = async (mode: 'save' | 'share' | 'print') => {
    setPdfBusy(mode);
    try {
      const doc = await buildPlayerReportPdf(player);
      const filename = `reporte-${player.firstName}-${player.lastName}.pdf`
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
      setPdfBusy(null);
    }
  };

  const remind = () => {
    const pending = playerPayments.find((p) => p.effective === 'pendiente' || p.effective === 'vencido');
    if (!pending) {
      toast.info('Sin cargos pendientes', 'Este jugador está al corriente.');
      return;
    }
    openWhatsApp(guardian?.whatsapp ?? guardian?.phone, paymentReminderMessage(guardian, player, pending));
  };

  return (
    <div>
      <PageHeader
        title="Perfil del jugador"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/jugadores')}>
              <ArrowLeft className="h-4 w-4" /> Jugadores
            </Button>
            {!readOnly && (
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => genPdf('save')} loading={pdfBusy === 'save'}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => genPdf('print')}
              loading={pdfBusy === 'print'}
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => genPdf('share')}
              loading={pdfBusy === 'share'}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Ficha */}
      <Card className="overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-brand-800 to-brand-600" />
        <div className="-mt-10 flex flex-wrap items-end gap-4 px-5 pb-5">
          <Avatar
            src={player.photo}
            name={fullName(player)}
            size="xl"
            className="ring-4 ring-white dark:ring-zinc-900"
          />
          <div className="min-w-0 flex-1 pb-1">
            <h2 className="text-xl font-bold">{fullName(player)}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Badge tone="green">{category?.name ?? 'Sin categoría'}</Badge>
              <span>{calcAge(player.birthDate)} años</span>
              {player.position && <span>· {player.position}</span>}
              {player.jerseyNumber != null && <span>· #{player.jerseyNumber}</span>}
              <StatusBadge status={player.status} />
            </div>
          </div>
          {guardian && (
            <div className="pb-1 text-right text-xs text-zinc-500">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                {guardian.relationship ?? 'Tutor'}: {fullName(guardian)}
              </p>
              {guardian.whatsapp && (
                <Button variant="whatsapp" size="sm" className="mt-1" onClick={remind}>
                  <MessageCircle className="h-3.5 w-3.5" /> Recordar pago
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Asistencia */}
        <Card>
          <CardHeader
            title="Asistencia"
            subtitle={stats ? `${stats.attendance.porcentaje}% de presencia` : ''}
          />
          <CardBody>
            {!stats ? null : stats.attendance.total === 0 ? (
              <EmptyState title="Sin registros de asistencia" />
            ) : (
              <>
                <Progress value={stats.attendance.porcentaje} />
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-900/20">
                    <p className="text-lg font-bold text-brand-700 dark:text-brand-300">
                      {stats.attendance.presentes}
                    </p>
                    <p className="text-zinc-500">Presentes</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                    <p className="text-lg font-bold text-red-600">{stats.attendance.ausentes}</p>
                    <p className="text-zinc-500">Ausentes</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
                    <p className="text-lg font-bold text-amber-600">{stats.attendance.retardos}</p>
                    <p className="text-zinc-500">Retardos</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                    <p className="text-lg font-bold text-blue-600">{stats.attendance.justificados}</p>
                    <p className="text-zinc-500">Justif.</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1.5 text-xs">
                  {playerAttendance.map(({ a, rec }) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between border-b border-zinc-50 pb-1.5 dark:border-zinc-800/60"
                    >
                      <span className="text-zinc-500">{formatDate(a.date)}</span>
                      <StatusBadge status={rec!.status} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardBody>
        </Card>

        {/* Pagos */}
        <Card>
          <CardHeader
            title="Pagos"
            subtitle={
              stats
                ? `${stats.payments.pagados} pagados · ${stats.payments.pendientes} pendientes · ${stats.payments.vencidos} vencidos`
                : ''
            }
          />
          <CardBody className="p-0">
            {playerPayments.length === 0 ? (
              <EmptyState title="Sin pagos registrados" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Concepto</Th>
                    <Th>Periodo</Th>
                    <Th>Monto</Th>
                    <Th>Estado</Th>
                  </tr>
                </THead>
                <TBody>
                  {playerPayments.slice(-6).map((p) => (
                    <Tr key={p.id}>
                      <Td>{p.concept}</Td>
                      <Td className="text-zinc-500">{p.period ? periodLabel(p.period) : '—'}</Td>
                      <Td className="font-medium">{formatCurrency(p.amount)}</Td>
                      <Td>
                        <StatusBadge status={p.effective} />
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Radar evaluación */}
        <Card>
          <CardHeader title="Evaluación actual vs anterior" subtitle="Escala 0-100" />
          <CardBody className="h-72">
            {!evaluations || evaluations.length === 0 ? (
              <EmptyState title="Sin evaluaciones" message="Registra una evaluación para ver el radar." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="area" fontSize={11} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Anterior"
                    dataKey="anterior"
                    stroke="#f5a801"
                    fill="#f5a801"
                    fillOpacity={0.25}
                  />
                  <Radar name="Actual" dataKey="actual" stroke="#177541" fill="#177541" fillOpacity={0.35} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Evolución */}
        <Card>
          <CardHeader title="Evolución" subtitle="Historial de evaluaciones" />
          <CardBody className="h-72">
            {evolutionData.length === 0 ? (
              <EmptyState title="Sin historial" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <XAxis dataKey="fecha" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    name="Técnica"
                    type="monotone"
                    dataKey="tecnica"
                    stroke="#177541"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    name="Velocidad"
                    type="monotone"
                    dataKey="velocidad"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    name="Táctica"
                    type="monotone"
                    dataKey="tactica"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    name="Físico"
                    type="monotone"
                    dataKey="fisico"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    name="Actitud"
                    type="monotone"
                    dataKey="actitud"
                    stroke="#f5a801"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {player.notes && (
        <Card className="mt-4">
          <CardHeader title="Observaciones" />
          <CardBody>
            <p className="text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">{player.notes}</p>
          </CardBody>
        </Card>
      )}

      <PlayerFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        player={player}
        categories={categories}
        guardians={guardians}
        onSubmit={async (data: PlayerForm & { photo?: string }) => {
          await playersService.update(player.id, data);
          toast.success('Jugador actualizado');
        }}
      />
    </div>
  );
}
