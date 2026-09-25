import { useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  ContactRound,
  ClipboardCheck,
  CreditCard,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Scale,
  Dumbbell,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts';
import { useDashboardStats } from '@/hooks/useData';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { can } from '@/stores/auth';

export default function DashboardPage() {
  const stats = useDashboardStats();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const canTrain = user?.role ? can(user.role, 'entrenamientos') : false;

  if (!stats) {
    return (
      <div>
        <PageHeader title="Panel" subtitle="Resumen general de la escuela" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const s = stats;
  return (
    <div>
      <PageHeader
        title="Panel"
        subtitle={`Resumen de la escuela · ${formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Users}
          label="Jugadores activos"
          value={s.jugadoresActivos}
          onClick={() => navigate('/app/jugadores')}
        />
        <StatCard icon={Layers} label="Categorías" value={s.categorias} />
        <StatCard icon={ContactRound} label="Entrenadores" value={s.entrenadores} />
        <StatCard
          icon={ClipboardCheck}
          label="Asistencia de hoy"
          value={
            s.asistenciaHoy.sessions > 0
              ? `${s.asistenciaHoy.presente}/${s.asistenciaHoy.presente + s.asistenciaHoy.ausente + s.asistenciaHoy.retardo + s.asistenciaHoy.justificado}`
              : '—'
          }
          sub={s.asistenciaHoy.sessions > 0 ? `${s.asistenciaHoy.sessions} sesión(es)` : 'Sin registros hoy'}
          tone="blue"
        />
        {isAdmin && (
          <>
            <StatCard
              icon={CreditCard}
              label="Cobrado del mes"
              value={formatCurrency(s.pagosMes.cobrado)}
              tone="brand"
              onClick={() => navigate('/app/pagos')}
            />
            <StatCard
              icon={Clock}
              label="Pagos pendientes"
              value={s.pendientes}
              tone="gold"
              onClick={() => navigate('/app/pagos')}
            />
            <StatCard
              icon={AlertTriangle}
              label="Pagos vencidos"
              value={s.vencidos}
              tone="red"
              onClick={() => navigate('/app/pagos')}
            />
            <StatCard
              icon={TrendingUp}
              label="Ingresos del mes"
              value={formatCurrency(s.ingresosMes)}
              tone="brand"
            />
            <StatCard
              icon={TrendingDown}
              label="Gastos del mes"
              value={formatCurrency(s.gastosMes)}
              tone="red"
            />
            <StatCard
              icon={Scale}
              label="Balance general"
              value={formatCurrency(s.balance)}
              tone={s.balance >= 0 ? 'brand' : 'red'}
              onClick={() => navigate('/app/finanzas')}
            />
          </>
        )}
      </div>

      {/* Gráficas */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Asistencia (últimas 2 semanas)" subtitle="Presentes · ausentes · retardos" />
          <CardBody className="h-64">
            {s.asistenciaSemanal.length === 0 ? (
              <EmptyState title="Sin asistencias registradas" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.asistenciaSemanal}>
                  <XAxis dataKey="fecha" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presente" name="Presentes" stackId="a" fill="#177541" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="retardo" name="Retardos" stackId="a" fill="#f5a801" />
                  <Bar dataKey="ausente" name="Ausentes" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Rendimiento promedio" subtitle="Evaluación anterior vs actual" />
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={s.rendimiento} outerRadius="72%">
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
          </CardBody>
        </Card>

        {isAdmin && (
          <>
            <Card>
              <CardHeader title="Ingresos vs gastos" subtitle="Últimos 6 meses" />
              <CardBody className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={s.finanzasMensual}>
                    <defs>
                      <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#177541" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#177541" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ingresos"
                      name="Ingresos"
                      stroke="#177541"
                      fill="url(#gi)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="gastos"
                      name="Gastos"
                      stroke="#dc2626"
                      fill="url(#gg)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Estado de pagos" subtitle="Distribución de mensualidades y cargos" />
              <CardBody className="h-64">
                {s.pagosDonut.every((d) => d.value === 0) ? (
                  <EmptyState title="Sin pagos registrados" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={s.pagosDonut}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {s.pagosDonut.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>
          </>
        )}

        {canTrain && (
          <Card className="lg:col-span-2">
            <CardHeader
              title="Próximos entrenamientos"
              action={
                <button
                  onClick={() => navigate('/app/entrenamientos')}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Ver todos
                </button>
              }
            />
            <CardBody className="p-0">
              {s.proximosEntrenamientos.length === 0 ? (
                <EmptyState
                  icon={<Dumbbell className="h-10 w-10" />}
                  title="Sin entrenamientos próximos"
                  message="Crea una sesión desde el módulo de entrenamientos."
                />
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {s.proximosEntrenamientos.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="rounded-lg bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        <Dumbbell className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-zinc-500">{t.duracion} min</p>
                      </div>
                      <span className="text-xs font-medium text-zinc-500">{formatDate(t.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
