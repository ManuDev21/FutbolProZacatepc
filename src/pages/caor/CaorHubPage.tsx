import { useNavigate } from 'react-router-dom';
import {
  Play,
  CalendarRange,
  Crosshair,
  Timer,
  Users,
  BookMarked,
  Move,
  Copy,
  Video,
  Save,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { CaorSubnav } from '@/components/caor/CaorSubnav';
import {
  useCaorPlans,
  useCaorPlays,
  useCaorRivals,
  useCaorTests,
  usePlayers,
} from '@/hooks/useData';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MODULES = [
  {
    to: '/app/caor/estudio',
    title: 'Estudio Táctico y Ejercicios',
    tag: 'Interactivo',
    icon: Play,
    desc: 'Mueve elementos en cancha, duplica jugadores, graba movimientos paso a paso y reproduce tus jugadas animadas.',
  },
  {
    to: '/app/caor/planificaciones',
    title: 'Planificaciones',
    tag: 'Microciclos',
    icon: CalendarRange,
    desc: 'Organiza microciclos semanales de lunes a domingo con control de minutos, esfuerzo RPE y tareas vinculadas.',
  },
  {
    to: '/app/caor/rival',
    title: 'Análisis del Rival',
    tag: 'Scouting',
    icon: Crosshair,
    desc: 'Registra el sistema táctico del rival en cancha, sus fortalezas, debilidades, balón parado y jugadores clave.',
  },
  {
    to: '/app/caor/test',
    title: 'Tests Físicos y Técnicos',
    tag: 'Medición',
    icon: Timer,
    desc: 'Evalúa velocidad, resistencia, salto, agilidad o registra pruebas personalizadas con ranking automático.',
  },
  {
    to: '/app/caor/jugadores',
    title: 'Ficha Técnica de Jugadores',
    tag: 'Personalizable',
    icon: Users,
    desc: 'Configura atributos a medida para cada jugador, perfil dominante, rol táctico y plan de mejora individual.',
  },
  {
    to: '/app/caor/biblioteca',
    title: 'Mi Biblioteca',
    tag: 'Colecciones',
    icon: BookMarked,
    desc: 'Guarda y clasifica tus propios ejercicios y jugadas por carpetas para reutilizarlos cuando quieras.',
  },
];

const CAPABILITIES = [
  { icon: Move, label: 'Mueve elementos libremente' },
  { icon: Copy, label: 'Duplica jugadores y material' },
  { icon: Video, label: 'Graba movimientos por pasos' },
  { icon: Play, label: 'Reproduce tus jugadas' },
  { icon: Save, label: 'Guarda tus ejercicios' },
  { icon: Sliders, label: '100% editable y personalizado' },
];

export default function CaorHubPage() {
  const navigate = useNavigate();
  const plays = useCaorPlays();
  const plans = useCaorPlans();
  const rivals = useCaorRivals();
  const tests = useCaorTests();
  const players = usePlayers();

  return (
    <div className="space-y-6">
      <CaorSubnav />

      {/* Encabezado principal sobrio con la paleta institucional */}
      <Card className="border-brand-800 bg-brand-800 p-6 text-white sm:p-8 dark:bg-brand-950">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">
              Sistema Digital CAOR
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Laboratorio Táctico y Metodológico
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-brand-100/85">
              Diseña jugadas animadas, planifica la semana de trabajo, analiza al rival y construye tu propia
              biblioteca de entrenamientos con almacenamiento local.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                variant="secondary"
                className="border-white bg-white text-brand-900 hover:bg-brand-50"
                onClick={() => navigate('/app/caor/estudio')}
              >
                <Play className="h-4 w-4" /> Abrir Estudio Táctico
              </Button>
              <Button
                variant="secondary"
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigate('/app/caor/planificaciones')}
              >
                <CalendarRange className="h-4 w-4" /> Planificaciones
              </Button>
              <Button
                variant="secondary"
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigate('/app/caor/biblioteca')}
              >
                <BookMarked className="h-4 w-4" /> Mi Biblioteca ({plays?.length ?? 0})
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.label}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-xs font-medium text-brand-50"
              >
                <cap.icon className="h-4 w-4 shrink-0 text-brand-200" />
                <span>{cap.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Indicadores resumidos con buen espaciado */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="p-5">
          <p className="text-xs font-medium text-zinc-500">Jugadas y Ejercicios</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{plays?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-zinc-500">Planificaciones</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{plans?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-zinc-500">Análisis de Rival</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{rivals?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-zinc-500">Tests Registrados</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{tests?.length ?? 0}</p>
        </Card>
        <Card className="col-span-2 p-5 sm:col-span-1">
          <p className="text-xs font-medium text-zinc-500">Jugadores en Plantilla</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{players?.length ?? 0}</p>
        </Card>
      </div>

      {/* Módulos del Sistema CAOR */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Card
            key={m.to}
            onClick={() => navigate(m.to)}
            className="flex cursor-pointer flex-col justify-between p-6 transition hover:border-brand-500 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <m.icon className="h-5 w-5" />
                </div>
                <Badge tone="green">{m.tag}</Badge>
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-100">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{m.desc}</p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400">
              Entrar al módulo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </div>
          </Card>
        ))}
      </div>

      {/* Últimas jugadas guardadas */}
      {plays && plays.length > 0 && (
        <Card>
          <CardHeader
            title="Trabajos recientes en tu Biblioteca"
            subtitle="Haz clic en cualquiera para abrirlo y reproducirlo en el Estudio Táctico"
          />
          <CardBody className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plays.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/app/caor/estudio?id=${p.id}`)}
                  className="cursor-pointer rounded-xl border border-zinc-200 p-4 transition hover:border-brand-500 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone="green">{p.kind}</Badge>
                    <span className="text-xs text-zinc-400">{p.keyframes.length} pasos</span>
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold">{p.title}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{p.folder}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
