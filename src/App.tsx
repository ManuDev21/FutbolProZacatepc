import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Rocket, Loader2 } from 'lucide-react';
import { router } from '@/router';
import { Toaster } from '@/components/ui/toaster';
import { ConfirmHost } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { isDbInitialized, initEmpty, seedDemo } from '@/db/seed';
import { toast } from '@/stores/toast';

type BootState = 'loading' | 'choose' | 'ready';

/** Pantalla de arranque con identidad Cañeros. */
function Splash() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-brand-900">
      <motion.img
        src="/logo.svg"
        alt="Cañeros de Zacatepec"
        className="h-28 w-28 drop-shadow-xl"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      />
      <div className="text-center">
        <p className="text-xl font-black tracking-wide text-white">FÚTBOLPRO</p>
        <p className="text-sm font-semibold tracking-[0.3em] text-gold-400">ZACATEPEC</p>
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-brand-300" />
    </div>
  );
}

/** Diálogo de primera ejecución: cargar demo o empezar vacío. */
function FirstRunChooser({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState<'demo' | 'empty' | null>(null);

  const run = async (mode: 'demo' | 'empty') => {
    setBusy(mode);
    try {
      if (mode === 'demo') {
        await seedDemo();
        toast.success('Datos de demostración cargados', 'Escuela, jugadores, pagos y entrenamientos listos.');
      } else {
        await initEmpty();
        toast.success('Aplicación lista', 'Empieza registrando tu escuela en Configuración.');
      }
      onDone();
    } catch (e) {
      console.error(e);
      toast.error('No se pudo inicializar', 'Intenta de nuevo.');
      setBusy(null);
    }
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-brand-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
      >
        <img src="/logo.svg" alt="Cañeros de Zacatepec" className="mx-auto h-20 w-20" />
        <h1 className="mt-3 text-center text-lg font-bold">Bienvenido a FútbolPro Zacatepec</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          ¿Deseas cargar datos de demostración para explorar la aplicación?
        </p>
        <div className="mt-6 space-y-3">
          <Button className="w-full" size="lg" loading={busy === 'demo'} onClick={() => run('demo')}>
            <Sparkles className="h-5 w-5" /> Sí, cargar demo
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            size="lg"
            loading={busy === 'empty'}
            onClick={() => run('empty')}
          >
            <Rocket className="h-5 w-5" /> Comenzar vacío
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Tus datos se guardan localmente en este dispositivo.
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<BootState>('loading');
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const initialized = await isDbInitialized();
        if (initialized) {
          const { exercisesService } = await import('@/services/exercises.service');
          await exercisesService.importLibrary().catch(() => {});
          await auth0Restore();
        }
        if (cancelled) return;
        setState(initialized ? 'ready' : 'choose');
      } catch (e) {
        console.error('Error de inicialización', e);
        if (!cancelled) setState('choose');
      }
    })();
    async function auth0Restore() {
      await restore();
    }
    return () => {
      cancelled = true;
    };
  }, [restore]);

  return (
    <>
      <AnimatePresence mode="wait">
        {state === 'loading' && (
          <motion.div key="splash" exit={{ opacity: 0 }}>
            <Splash />
          </motion.div>
        )}
        {state === 'choose' && (
          <motion.div key="choose" exit={{ opacity: 0 }}>
            <FirstRunChooser onDone={() => setState('ready')} />
          </motion.div>
        )}
        {state === 'ready' && <RouterProvider key="app" router={router} />}
      </AnimatePresence>
      <Toaster />
      <ConfirmHost />
    </>
  );
}
