import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
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
  CheckCircle2,
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
    title: 'Estudio Táctico & Ejercicios Animados',
    badge: 'Interactivo',
    icon: Play,
    desc: 'Mueve elementos, duplica jugadores, graba movimientos fotograma a fotograma o en vivo y reproduce tus jugadas.',
    highlights: ['↔️ Mueve elementos', '➕ Duplica jugadores', '🎥 Graba movimientos', '▶️ Reproduce jugadas'],
  },
  {
    to: '/app/caor/planificaciones',
    title: 'Planificaciones Deportivas',
    badge: 'Microciclos',
    icon: CalendarRange,
    desc: 'Diseña microciclos semanales (Lunes a Domingo), mesociclos y macrociclos con control de carga RPE y volumen.',
    highlights: ['✅ Planificaciones semanales', '📊 Carga RPE y minutos', '🔗 Vincula jugadas CAOR'],
  },
  {
    to: '/app/caor/rival',
    title: 'Análisis del Rival (Scouting)',
    badge: 'Scouting',
    icon: Crosshair,
    desc: 'Prepara el partido: sistema táctico rival en cancha, fortalezas, debilidades, jugadores clave y balón parado.',
    highlights: ['✅ Pizarra del rival', '⭐ Jugadores amenaza', '📋 Plan de partido'],
  },
  {
    to: '/app/caor/test',
    title: 'Test Físicos y Técnicos',
    badge: 'Medición',
    icon: Timer,
    desc: 'Evalúa velocidad, resistencia, fuerza explosiva, agilidad o crea tus propios tests 100% personalizados.',
    highlights: ['✅ 10 baterías listas', '⚙️ Tests personalizados', '🏆 Ranking automático'],
  },
  {
    to: '/app/caor/jugadores',
    title: 'Jugadores CAOR · Ficha Técnica',
    badge: '100% Editable',
    icon: Users,
    desc: 'Perfil táctico individual con atributos 100% personalizables, pie dominante, rol táctico y objetivos de mejora.',
    highlights: ['✅ Atributos a medida', '🦶 Perfil y demarcaciones', '📈 Plan individual'],
  },
  {
    to: '/app/caor/biblioteca',
    title: 'Mi Biblioteca CAOR',
    badge: 'Colecciones',
    icon: BookMarked,
    desc: 'Organiza tus jugadas, ejercicios, automatismos y balón parado en tus propias carpetas y colecciones.',
    highlights: ['💾 Guarda tus ejercicios', '📚 Carpetas propias', '📤 Exporta/Importa JSON'],
  },
];

export default function CaorHubPage() {
  const navigate = useNavigate();
  const plays = useCaorPlays();
  const plans = useCaorPlans();
  const rivals = useCaorRivals();
  const tests = useCaorTests();
  const players = usePlayers();

  return (
    <div>
      <CaorSubnav />

      {/* Banner Hero del Sistema Digital CAOR */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-6 text-white shadow-lg">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 px-3 py-1 text-xs font-extrabold tracking-wider text-gold-400 uppercase">
              <Sparkles className="h-3.5 w-3.5" /> 📚 Sistema Digital CAOR · 100% Editable y Personalizado
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Laboratorio Táctico, Planificación y Rendimiento CAOR
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-100/85">
              Diseña jugadas animadas, planifica la semana de trabajo, analiza al rival, registra tests físicos
              y construye tu propia biblioteca metodológica — todo almacenado localmente sin depender de internet.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button variant="gold" onClick={() => navigate('/app/caor/estudio')}>
                <Play className="h-4 w-4" /> Abrir Estudio de Jugadas
              </Button>
              <Button
                variant="secondary"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigate('/app/caor/planificaciones')}
              >
                <CalendarRange className="h-4 w-4" /> Nueva Planificación
              </Button>
              <Button
                variant="secondary"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigate('/app/caor/biblioteca')}
              >
                <BookMarked className="h-4 w-4" /> Mi Biblioteca ({plays?.length ?? 0})
              </Button>
            </div>
          </div>

          {/* Checklist de capacidades */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/25 p-4 text-xs backdrop-blur-xs">
            {[
              [Move, '↔️ Mueve elementos'],
              [Copy, '➕ Duplica jugadores'],
              [Video, '🎥 Graba movimientos'],
              [Play, '▶️ Reproduce tus jugadas'],
              [Save, '💾 Guarda tus ejercicios'],
              [BookMarked, '📚 Crea tu biblioteca'],
              [CheckCircle2, '✅ 100% editable'],
              [Sparkles, '⚡ 100% Offline local'],
            ].map(([Icon, text], i) => {
              const Ic = Icon as typeof Move;
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 font-semibold">
                  <Ic className="h-4 w-4 shrink-0 text-gold-400" />
                  <span>{text as string}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPIs rápidos de CAOR */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Jugadas / Ejercicios CAOR</p>
          <p className="mt-1 text-2xl font-black text-brand-700 dark:text-brand-400">{plays?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Planificaciones</p>
          <p className="mt-1 text-2xl font-black text-brand-700 dark:text-brand-400">{plans?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Informes de Rival</p>
          <p className="mt-1 text-2xl font-black text-brand-700 dark:text-brand-400">{rivals?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Tests Registrados</p>
          <p className="mt-1 text-2xl font-black text-brand-700 dark:text-brand-400">{tests?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Plantilla de Jugadores</p>
          <p className="mt-1 text-2xl font-black text-brand-700 dark:text-brand-400">{players?.length ?? 0}</p>
        </Card>
      </div>

      {/* Tarjetas de módulos CAOR */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Card
            key={m.to}
            className="flex cursor-pointer flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
            onClick={() => navigate(m.to)}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  <m.icon className="h-5 w-5" />
                </div>
                <Badge tone="green">{m.badge}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold">{m.title}</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{m.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end text-xs font-bold text-brand-600 dark:text-brand-400">
              Abrir módulo <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </div>
          </Card>
        ))}
      </div>

      {/* Últimas jugadas animadas creadas */}
      {plays && plays.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="Recientes en tu Biblioteca CAOR"
            subtitle="Abre cualquiera en el Estudio para reproducir su animación"
          />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {plays.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/app/caor/estudio?id=${p.id}`)}
                  className="cursor-pointer rounded-xl border border-zinc-200 p-3 transition hover:border-brand-500 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone="green">{p.kind}</Badge>
                    <span className="text-[11px] text-zinc-400">{p.keyframes.length} pasos</span>
                  </div>
                  <p className="mt-2 truncate font-bold text-sm">{p.title}</p>
                  <p className="truncate text-xs text-zinc-500">{p.folder}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
