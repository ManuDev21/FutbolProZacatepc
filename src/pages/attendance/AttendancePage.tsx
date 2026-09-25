import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Pencil, Trash2, Save, MessageCircle, History } from 'lucide-react';
import { useAttendances, useCategories, usePlayers, useTrainings, useGuardians } from '@/hooks/useData';
import { attendanceService } from '@/services/attendance.service';
import { openWhatsApp, attendanceMessage } from '@/services/whatsapp.service';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar, EmptyState, PageHeader, TableSkeleton } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { formatDate, fullName, todayISO, cn } from '@/lib/utils';
import type { Attendance, AttendanceRecord, AttendanceStatus } from '@/types';

const STATUS_ORDER: { key: AttendanceStatus; label: string; active: string }[] = [
  { key: 'presente', label: 'Presente', active: 'bg-brand-600 text-white border-brand-600' },
  { key: 'retardo', label: 'Retardo', active: 'bg-gold-500 text-brand-950 border-gold-500' },
  { key: 'ausente', label: 'Ausente', active: 'bg-red-600 text-white border-red-600' },
  { key: 'justificado', label: 'Justificado', active: 'bg-blue-600 text-white border-blue-600' },
];

export default function AttendancePage() {
  const categories = useCategories();
  const players = usePlayers();
  const trainings = useTrainings();
  const guardians = useGuardians();
  const attendances = useAttendances();

  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [trainingId, setTrainingId] = useState('');
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [existingId, setExistingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const roster = useMemo(
    () =>
      (players ?? [])
        .filter((p) => p.categoryId === categoryId && p.status !== 'baja')
        .sort((a, b) => fullName(a).localeCompare(fullName(b), 'es')),
    [players, categoryId],
  );

  const catTrainings = useMemo(
    () => (trainings ?? []).filter((t) => t.categoryId === categoryId),
    [trainings, categoryId],
  );

  const guardianOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of players ?? []) {
      const g = (guardians ?? []).find((x) => x.id === p.guardianId || x.playerIds.includes(p.id));
      if (g) m.set(p.id, g.whatsapp ?? g.phone ?? '');
    }
    return m;
  }, [players, guardians]);

  // Cargar sesión existente al cambiar categoría/fecha
  useEffect(() => {
    if (!categoryId || !attendances) {
      setRecords({});
      setExistingId(undefined);
      return;
    }
    const existing = attendances.find((a) => a.categoryId === categoryId && a.date === date);
    if (existing) {
      setExistingId(existing.id);
      setTrainingId(existing.trainingId ?? '');
      const map: Record<string, AttendanceRecord> = {};
      for (const r of existing.records) map[r.playerId] = r;
      setRecords(map);
    } else {
      setExistingId(undefined);
      const map: Record<string, AttendanceRecord> = {};
      for (const p of roster) map[p.id] = { playerId: p.id, status: 'presente' };
      setRecords(map);
    }
  }, [categoryId, date, attendances, roster]);

  const setStatus = (playerId: string, status: AttendanceStatus) => {
    setRecords((r) => ({
      ...r,
      [playerId]: {
        ...r[playerId],
        playerId,
        status,
        time:
          status === 'retardo'
            ? (r[playerId]?.time ?? new Date().toTimeString().slice(0, 5))
            : r[playerId]?.time,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceRecord> = {};
    for (const p of roster) map[p.id] = { playerId: p.id, status };
    setRecords(map);
  };

  const save = async () => {
    if (!categoryId) {
      toast.warning('Selecciona una categoría');
      return;
    }
    setSaving(true);
    try {
      await attendanceService.saveSession(
        { date, categoryId, trainingId: trainingId || undefined, records: Object.values(records) },
        existingId,
      );
      toast.success(
        existingId ? 'Asistencia actualizada' : 'Asistencia registrada',
        `${roster.length} jugadores`,
      );
    } catch {
      toast.error('No se pudo guardar la asistencia');
    } finally {
      setSaving(false);
    }
  };

  const removeSession = async (a: Attendance) => {
    if (
      !(await confirmDialog({
        title: 'Eliminar registro de asistencia',
        message: `¿Eliminar la asistencia del ${formatDate(a.date)}?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await attendanceService.remove(a.id);
    toast.success('Registro eliminado');
  };

  const loadSession = (a: Attendance) => {
    setCategoryId(a.categoryId);
    setDate(a.date);
    setTrainingId(a.trainingId ?? '');
    toast.info('Sesión cargada para edición');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = useMemo(() => {
    const s = { presente: 0, ausente: 0, retardo: 0, justificado: 0 };
    Object.values(records).forEach((r) => s[r.status]++);
    return s;
  }, [records]);

  return (
    <div>
      <PageHeader
        title="Control de asistencias"
        subtitle="Selecciona categoría y fecha para registrar"
        actions={
          categoryId && roster.length > 0 ? (
            <Button onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> {existingId ? 'Actualizar' : 'Guardar'} asistencia
            </Button>
          ) : undefined
        }
      />

      {/* Selectores */}
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Categoría" required>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setTrainingId('');
              }}
            >
              <option value="">Seleccionar...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (F{c.format})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Entrenamiento (opcional)">
            <Select value={trainingId} onChange={(e) => setTrainingId(e.target.value)}>
              <option value="">Sin vincular</option>
              {catTrainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Lista de jugadores */}
      {categoryId && (
        <Card className="mb-4">
          <CardHeader
            title={`Lista de asistencia — ${roster.length} jugadores`}
            subtitle={
              existingId
                ? 'Editando registro existente'
                : `${stats.presente} presentes · ${stats.retardo} retardos · ${stats.ausente} ausentes · ${stats.justificado} justificados`
            }
            action={
              <Button variant="secondary" size="sm" onClick={() => markAll('presente')}>
                <CheckCheck className="h-4 w-4" /> Todos presentes
              </Button>
            }
          />
          {!players ? (
            <TableSkeleton />
          ) : roster.length === 0 ? (
            <EmptyState title="La categoría no tiene jugadores" />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {roster.map((p) => {
                const rec = records[p.id];
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Avatar src={p.photo} name={fullName(p)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{fullName(p)}</p>
                      <p className="text-xs text-zinc-400">
                        {p.position ?? '—'}
                        {p.jerseyNumber != null ? ` · #${p.jerseyNumber}` : ''}
                      </p>
                    </div>
                    {rec?.status === 'retardo' && (
                      <Input
                        type="time"
                        value={rec.time ?? ''}
                        onChange={(e) =>
                          setRecords((r) => ({
                            ...r,
                            [p.id]: { ...r[p.id], playerId: p.id, status: 'retardo', time: e.target.value },
                          }))
                        }
                        className="w-24 py-1 text-xs"
                      />
                    )}
                    <div className="flex gap-1">
                      {STATUS_ORDER.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setStatus(p.id, s.key)}
                          className={cn(
                            'rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium transition-colors dark:border-zinc-700',
                            rec?.status === s.key
                              ? s.active
                              : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {(rec?.status === 'ausente' || rec?.status === 'retardo') && guardianOf.get(p.id) && (
                      <Button
                        variant="whatsapp"
                        size="icon"
                        title="Avisar por WhatsApp"
                        onClick={() =>
                          openWhatsApp(guardianOf.get(p.id), attendanceMessage(p, rec.status, date))
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {/* Historial */}
      <Card>
        <CardHeader title="Historial de asistencias" subtitle="Últimas sesiones registradas" />
        {!attendances ? (
          <TableSkeleton />
        ) : attendances.length === 0 ? (
          <EmptyState
            icon={<History className="h-10 w-10" />}
            title="Sin registros aún"
            message="Las sesiones que captures aparecerán aquí."
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Fecha</Th>
                <Th>Categoría</Th>
                <Th>Presentes</Th>
                <Th>Ausentes</Th>
                <Th>Retardos</Th>
                <Th>Justif.</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {attendances.slice(0, 20).map((a) => {
                const s = { presente: 0, ausente: 0, retardo: 0, justificado: 0 };
                a.records.forEach((r) => s[r.status]++);
                const cat = categories?.find((c) => c.id === a.categoryId);
                return (
                  <Tr key={a.id}>
                    <Td className="font-medium">{formatDate(a.date)}</Td>
                    <Td>{cat?.name ?? '—'}</Td>
                    <Td>
                      <StatusBadge status="presente" />
                      <span className="ml-1.5 text-xs">{s.presente}</span>
                    </Td>
                    <Td>
                      <StatusBadge status="ausente" />
                      <span className="ml-1.5 text-xs">{s.ausente}</span>
                    </Td>
                    <Td>
                      <StatusBadge status="retardo" />
                      <span className="ml-1.5 text-xs">{s.retardo}</span>
                    </Td>
                    <Td>
                      <StatusBadge status="justificado" />
                      <span className="ml-1.5 text-xs">{s.justificado}</span>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => loadSession(a)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeSession(a)} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
