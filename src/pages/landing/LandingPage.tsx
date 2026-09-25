import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  ClipboardList,
  Wallet,
  Smartphone,
  Goal,
  Download,
  ChevronRight,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';

const FEATURES = [
  {
    icon: Users,
    title: 'Gestión de jugadores',
    desc: 'Toda tu plantilla organizada: perfiles, fotos, categorías y tutores.',
  },
  { icon: ClipboardCheck, title: 'Asistencias', desc: 'Control rápido de presencia por categoría y sesión.' },
  {
    icon: CreditCard,
    title: 'Mensualidades',
    desc: 'Visualiza pagos pendientes y vencidos, y recuerda por WhatsApp.',
  },
  {
    icon: Dumbbell,
    title: 'Entrenamientos',
    desc: 'Biblioteca con +1,000 ejercicios y constructor de sesiones.',
  },
  {
    icon: Goal,
    title: 'Pizarra táctica',
    desc: 'Diseña tus cuadros: 4-4-2, 4-3-3 en F11 y 3-2-1, 2-3-1 en F7.',
  },
  {
    icon: ClipboardList,
    title: 'Evaluaciones',
    desc: 'Muestra la evolución de cada jugador con radar y comparativas.',
  },
  { icon: Wallet, title: 'Finanzas', desc: 'Controla ingresos, gastos y balance en tiempo real.' },
  {
    icon: Smartphone,
    title: 'PWA instalable',
    desc: 'Disponible desde celular, tablet y computadora. Funciona sin conexión.',
  },
];

export default function LandingPage() {
  const installPrompt = useUiStore((s) => s.installPrompt);
  const user = useAuthStore((s) => s.user);

  const install = async () => {
    if (!installPrompt) return;
    await (installPrompt as unknown as { prompt: () => Promise<void> }).prompt();
    useUiStore.getState().setInstallPrompt(null);
  };

  return (
    <div className="min-h-dvh bg-brand-950 text-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Cañeros de Zacatepec" className="h-10 w-10" />
          <div>
            <p className="text-sm font-black tracking-wide">FÚTBOLPRO</p>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-gold-400">ZACATEPEC</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {installPrompt && (
            <Button variant="gold" size="sm" onClick={install}>
              <Download className="h-4 w-4" /> Instalar
            </Button>
          )}
          <Link to={user ? '/app' : '/login'}>
            <Button
              size="sm"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              {user ? 'Ir al panel' : 'Entrar'}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <div className="absolute top-10 left-10 h-64 w-64 rounded-full border-8 border-white" />
          <div className="absolute right-10 bottom-10 h-96 w-96 rounded-full border-8 border-white" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-20 sm:pt-16 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-200">
              <WifiOff className="h-3.5 w-3.5" /> Funciona 100% sin conexión
            </span>
            <h1 className="mt-4 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              Todo lo que tu escuela de fútbol necesita,{' '}
              <span className="text-gold-400">en un solo lugar.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-brand-100/80">
              Gestiona jugadores, asistencias, mensualidades, entrenamientos, evaluaciones y finanzas desde
              una sola aplicación.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? '/app' : '/login'}>
                <Button size="lg" variant="gold">
                  Comenzar <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              {installPrompt && (
                <Button
                  size="lg"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={install}
                >
                  <Download className="h-5 w-5" /> Instalar aplicación
                </Button>
              )}
            </div>
            <p className="mt-6 text-xs text-brand-200/60">
              Tus datos se almacenan localmente en tu dispositivo. Sin servidores, sin mensualidades de
              software.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="relative mx-auto hidden lg:block"
          >
            <img src="/logo.svg" alt="Escudo Cañeros" className="h-80 w-80 drop-shadow-2xl" />
            <div className="absolute -right-6 -bottom-4 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-black text-gold-400">+1,000</p>
              <p className="text-xs text-brand-100">ejercicios en la biblioteca</p>
            </div>
            <div className="absolute -left-8 top-8 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-black text-gold-400">F7 · F11</p>
              <p className="text-xs text-brand-100">pizarra táctica</p>
            </div>
          </motion.div>
        </div>
        {/* Franja */}
        <div className="h-2 bg-gradient-to-r from-brand-600 via-gold-500 to-brand-600" />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Administración deportiva profesional</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-brand-100/70">
          Módulos completos que cubren la operación diaria de tu escuela.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <span className="inline-flex rounded-xl bg-brand-600/40 p-2.5 text-gold-400">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-brand-100/70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-brand-200/50">
        <p>FútbolProZacatepec — PWA de administración local. Los datos viven en tu dispositivo.</p>
        <p className="mt-1">Colores y escudo con identidad del Club Cañeros de Zacatepec.</p>
      </footer>
    </div>
  );
}
