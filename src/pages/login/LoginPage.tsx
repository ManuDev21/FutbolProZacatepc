import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/stores/toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      toast.success('Bienvenido');
      navigate('/app');
    } else {
      toast.error('Credenciales incorrectas', 'Verifica usuario y contraseña.');
    }
  };

  const quick = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-2 dark:bg-zinc-900"
      >
        {/* Panel marca */}
        <div className="relative hidden flex-col items-center justify-center gap-4 bg-brand-800 p-10 lg:flex">
          <img src="/logo.svg" alt="Cañeros de Zacatepec" className="h-32 w-32 drop-shadow-xl" />
          <div className="text-center">
            <p className="text-2xl font-black text-white">FÚTBOLPRO</p>
            <p className="text-sm font-semibold tracking-[0.35em] text-gold-400">ZACATEPEC</p>
          </div>
          <p className="text-center text-sm text-brand-100/70">
            Administración integral de tu escuela de fútbol. Sin internet, sin servidores.
          </p>
        </div>

        {/* Formulario */}
        <div className="p-6 sm:p-10">
          <img src="/logo.svg" alt="Cañeros" className="mx-auto h-16 w-16 lg:hidden" />
          <h1 className="mt-2 text-xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-zinc-500">Acceso local — solo este dispositivo</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Usuario" required>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
              />
            </Field>
            <Field label="Contraseña" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <LogIn className="h-5 w-5" /> Entrar
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-brand-50 p-3 text-xs text-brand-900 dark:bg-brand-900/20 dark:text-brand-200">
            <p className="flex items-center gap-1.5 font-semibold">
              <Info className="h-3.5 w-3.5" /> Usuarios de demostración
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => quick('admin', 'admin123')}
                className="rounded-lg bg-white px-2 py-1 font-mono shadow-sm hover:bg-brand-100 dark:bg-zinc-800"
              >
                admin / admin123
              </button>
              <button
                onClick={() => quick('entrenador', 'coach123')}
                className="rounded-lg bg-white px-2 py-1 font-mono shadow-sm hover:bg-brand-100 dark:bg-zinc-800"
              >
                entrenador / coach123
              </button>
              <button
                onClick={() => quick('padre', 'padre123')}
                className="rounded-lg bg-white px-2 py-1 font-mono shadow-sm hover:bg-brand-100 dark:bg-zinc-800"
              >
                padre / padre123
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-zinc-400">
            Autenticación simulada para roles locales. No es un sistema de seguridad de servidor.
          </p>
          <p className="mt-2 text-center">
            <Link to="/" className="text-xs text-brand-600 hover:underline">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
