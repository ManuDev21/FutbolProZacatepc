import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Camera,
  Download,
  FileSpreadsheet,
  HardDriveDownload,
  HardDriveUpload,
  MessageCircle,
  Moon,
  Paintbrush,
  RefreshCw,
  ShieldAlert,
  Sun,
  Trash2,
  Users,
  Wallet,
  Bell,
  ScrollText,
} from 'lucide-react';
import { useCategories, useSchool, useUsers } from '@/hooks/useData';
import { settingsService, SETTINGS_KEYS } from '@/services/settings.service';
import { authService } from '@/services/auth.service';
import { backupService, type ImportSummary } from '@/services/backup.service';
import { paymentsService } from '@/services/payments.service';
import { seedDemo } from '@/db/seed';
import { fileToCompressedDataUrl } from '@/lib/image';
import { toast } from '@/stores/toast';
import { confirmDialog } from '@/stores/confirm';
import { useUiStore } from '@/stores/ui';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Avatar, PageHeader, Switch } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { schoolSchema, userSchema, type SchoolForm, type UserForm } from '@/lib/validators';
import { formatDateTime, toPeriod } from '@/lib/utils';
import type { User } from '@/types';

const TABS = [
  { key: 'escuela', label: 'Escuela', icon: Building2 },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'apariencia', label: 'Apariencia', icon: Paintbrush },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'mensualidades', label: 'Mensualidades', icon: Wallet },
  { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { key: 'datos', label: 'Datos', icon: HardDriveDownload },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('escuela');
  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Preferencias de la escuela y administración de datos locales"
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-2">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? 'bg-brand-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
        </Card>
        <div className="min-w-0">
          {tab === 'escuela' && <SchoolTab />}
          {tab === 'usuarios' && <UsersTab />}
          {tab === 'apariencia' && <AppearanceTab />}
          {tab === 'whatsapp' && <WhatsappTab />}
          {tab === 'mensualidades' && <FeesTab />}
          {tab === 'notificaciones' && <NotifTab />}
          {tab === 'datos' && <DataTab />}
        </div>
      </div>
    </div>
  );
}

// ---------- Escuela ----------

function SchoolTab() {
  const school = useSchool();
  const [logo, setLogo] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolForm>({ resolver: zodResolver(schoolSchema) });

  useEffect(() => {
    if (school) {
      reset({
        name: school.name,
        phone: school.phone ?? '',
        whatsapp: school.whatsapp ?? '',
        email: school.email ?? '',
        address: school.address ?? '',
        monthlyFee: school.monthlyFee,
        primaryColor: school.primaryColor ?? '#177541',
      });
      setLogo(school.logo);
    }
  }, [school, reset]);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      await settingsService.saveSchool({ ...data, logo });
      toast.success('Escuela actualizada');
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  });

  return (
    <Card>
      <CardHeader
        title="Datos de la escuela"
        subtitle="Nombre, contacto e identidad que aparecen en reportes y mensajes"
      />
      <CardBody className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={logo ?? '/logo.svg'} name="Escuela" size="xl" />
          <div>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> Cambiar logo
            </Button>
            <p className="mt-1 text-xs text-zinc-400">Se usa en encabezados de PDF y pantallas de carga.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setLogo(await fileToCompressedDataUrl(f, 320));
                } catch (err) {
                  toast.error('Imagen no válida', err instanceof Error ? err.message : undefined);
                }
              }}
            />
          </div>
        </div>
        <Field label="Nombre de la escuela" required error={errors.name?.message}>
          <Input {...register('name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" error={errors.phone?.message}>
            <Input {...register('phone')} />
          </Field>
          <Field label="WhatsApp" error={errors.whatsapp?.message}>
            <Input {...register('whatsapp')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Dirección" error={errors.address?.message}>
            <Input {...register('address')} />
          </Field>
          <Field label="Mensualidad ($)" error={errors.monthlyFee?.message}>
            <Input type="number" step="0.01" {...register('monthlyFee', { valueAsNumber: true })} />
          </Field>
          <Field label="Color principal" error={errors.primaryColor?.message}>
            <Input type="color" {...register('primaryColor')} className="h-10 p-1" />
          </Field>
        </div>
        <Button onClick={save} loading={saving}>
          Guardar cambios
        </Button>
      </CardBody>
    </Card>
  );
}

// ---------- Usuarios ----------

function UsersTab() {
  const users = useUsers();
  const [modal, setModal] = useState<{ open: boolean; user?: User | null }>({ open: false });
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'coach', active: true },
  });

  useEffect(() => {
    if (modal.open) {
      reset(
        modal.user
          ? {
              username: modal.user.username,
              displayName: modal.user.displayName,
              role: modal.user.role,
              password: '',
              active: modal.user.active,
            }
          : { role: 'coach', active: true },
      );
    }
  }, [modal.open, modal.user, reset]);

  const save = handleSubmit(async (data) => {
    setSaving(true);
    try {
      if (modal.user) {
        await authService.updateUser(modal.user.id, { ...data, password: data.password || undefined });
        toast.success('Usuario actualizado');
      } else {
        if (!data.password) {
          toast.error('Define una contraseña para el nuevo usuario');
          return;
        }
        await authService.createUser({ ...data, password: data.password });
        toast.success('Usuario creado');
      }
      setModal({ open: false });
    } catch (e) {
      toast.error('No se pudo guardar', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  });

  const remove = async (u: User) => {
    if (u.username === 'admin') {
      toast.warning('No puedes eliminar al administrador principal');
      return;
    }
    if (
      !(await confirmDialog({
        title: 'Eliminar usuario',
        message: `¿Eliminar al usuario "${u.username}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      }))
    )
      return;
    await authService.removeUser(u.id);
    toast.success('Usuario eliminado');
  };

  const roleLabel = { admin: 'Administrador', coach: 'Entrenador', parent: 'Padre/Tutor' };

  return (
    <Card>
      <CardHeader
        title="Usuarios locales"
        subtitle="Autenticación simulada — no es seguridad de servidor. Los permisos están desacoplados para una futura migración."
        action={
          <Button size="sm" onClick={() => setModal({ open: true, user: null })}>
            Nuevo usuario
          </Button>
        }
      />
      <Table>
        <THead>
          <tr>
            <Th>Usuario</Th>
            <Th>Nombre</Th>
            <Th>Rol</Th>
            <Th>Estado</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </THead>
        <TBody>
          {(users ?? []).map((u) => (
            <Tr key={u.id}>
              <Td className="font-mono text-sm">{u.username}</Td>
              <Td className="font-medium">{u.displayName}</Td>
              <Td>
                <Badge tone={u.role === 'admin' ? 'red' : u.role === 'coach' ? 'green' : 'blue'}>
                  {roleLabel[u.role]}
                </Badge>
              </Td>
              <Td>
                <Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Activo' : 'Inactivo'}</Badge>
              </Td>
              <Td className="text-right">
                <div className="inline-flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setModal({ open: true, user: u })}>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(u)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      <div className="border-t border-zinc-100 p-4 text-xs text-zinc-500 dark:border-zinc-800">
        <p className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
          Las credenciales se almacenan solo en este dispositivo para simular roles. Al migrar a un backend,
          este sistema se sustituirá por autenticación real.
        </p>
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.user ? 'Editar usuario' : 'Nuevo usuario'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nombre visible" required error={errors.displayName?.message}>
            <Input {...register('displayName')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Usuario" required error={errors.username?.message}>
              <Input {...register('username')} autoComplete="off" />
            </Field>
            <Field label="Rol" required error={errors.role?.message}>
              <Select {...register('role')}>
                <option value="admin">Administrador — acceso total</option>
                <option value="coach">Entrenador — módulos deportivos</option>
                <option value="parent">Padre/Tutor — solo consulta</option>
              </Select>
            </Field>
          </div>
          <Field
            label={modal.user ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            required={!modal.user}
            error={errors.password?.message}
            hint={modal.user ? 'Déjala vacía para conservar la actual' : 'Mínimo 6 caracteres'}
          >
            <Input type="password" {...register('password')} autoComplete="new-password" />
          </Field>
          <Switch checked={watch('active')} onChange={(v) => setValue('active', v)} label="Usuario activo" />
        </div>
      </Modal>
    </Card>
  );
}

// ---------- Apariencia ----------

function AppearanceTab() {
  const { theme, toggleTheme } = useUiStore();
  return (
    <Card>
      <CardHeader title="Apariencia" subtitle="Preferencias visuales (se guardan en este navegador)" />
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-brand-400" />
            ) : (
              <Sun className="h-5 w-5 text-gold-500" />
            )}
            <div>
              <p className="text-sm font-medium">Tema {theme === 'dark' ? 'oscuro' : 'claro'}</p>
              <p className="text-xs text-zinc-500">Cambia la apariencia de toda la aplicación.</p>
            </div>
          </div>
          <Switch checked={theme === 'dark'} onChange={toggleTheme} label="" />
        </div>
        <p className="text-xs text-zinc-400">
          Los colores institucionales (verde/blanco/dorado Cañeros) se mantienen en ambos temas.
        </p>
      </CardBody>
    </Card>
  );
}

// ---------- WhatsApp ----------

function WhatsappTab() {
  const [template, setTemplate] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsService.getSetting<string>(SETTINGS_KEYS.whatsappTemplate).then((t) => {
      setTemplate(
        t ??
          'Hola {tutor}, te recordamos que la mensualidad de {jugador} correspondiente a {periodo} se encuentra pendiente. Monto: ${monto}. — FútbolPro Zacatepec',
      );
      setLoaded(true);
    });
  }, []);

  return (
    <Card>
      <CardHeader
        title="Mensajes de WhatsApp"
        subtitle="Los mensajes se abren en wa.me con texto prellenado. No hay envíos automáticos."
      />
      <CardBody className="space-y-4">
        <Field
          label="Plantilla de recordatorio de pago"
          hint="Variables: {tutor} {jugador} {periodo} {monto}"
        >
          <textarea
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            rows={4}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
        </Field>
        <Button
          disabled={!loaded}
          onClick={async () => {
            await settingsService.setSetting(SETTINGS_KEYS.whatsappTemplate, template);
            toast.success('Plantilla guardada');
          }}
        >
          Guardar plantilla
        </Button>
      </CardBody>
    </Card>
  );
}

// ---------- Mensualidades ----------

function FeesTab() {
  const school = useSchool();
  const categories = useCategories();
  const [fee, setFee] = useState('500');
  const [period, setPeriod] = useState(toPeriod(new Date()));
  const [catId, setCatId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (school) setFee(String(school.monthlyFee));
  }, [school]);

  return (
    <Card>
      <CardHeader title="Mensualidades" subtitle="Monto por defecto y generación masiva de cargos" />
      <CardBody className="space-y-4">
        <Field label="Monto de mensualidad">
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-40"
            />
            <Button
              variant="secondary"
              onClick={async () => {
                await settingsService.saveSchool({ monthlyFee: Number(fee) || 0 });
                toast.success('Mensualidad actualizada');
              }}
            >
              Guardar
            </Button>
          </div>
        </Field>
        <div className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <p className="text-sm font-semibold">Generar cargos del periodo</p>
          <p className="mb-3 text-xs text-zinc-500">
            Crea mensualidades pendientes para jugadores activos sin cargo en el periodo.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Periodo">
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </Field>
            <Field label="Categoría">
              <Select value={catId} onChange={(e) => setCatId(e.target.value)} className="w-40">
                <option value="">Todas</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await settingsService.saveSchool({ monthlyFee: Number(fee) || school?.monthlyFee || 0 });
                  const n = await paymentsService.generateMonthly(period, catId || undefined);
                  toast.success(n > 0 ? `${n} mensualidades generadas` : 'Todo al corriente en ese periodo');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Generar
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ---------- Notificaciones ----------

function NotifTab() {
  const [prefs, setPrefs] = useState({ pagos: true, entrenamientos: true, evaluaciones: true });
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    settingsService.getSetting<typeof prefs>(SETTINGS_KEYS.notifPrefs).then((p) => {
      if (p) setPrefs(p);
      setLoaded(true);
    });
  }, []);

  const toggle = async (key: keyof typeof prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await settingsService.setSetting(SETTINGS_KEYS.notifPrefs, next);
  };

  return (
    <Card>
      <CardHeader title="Notificaciones" subtitle="Alertas internas calculadas localmente (sin servidor)" />
      <CardBody className="space-y-3">
        {(
          [
            ['pagos', 'Pagos pendientes y vencidos'],
            ['entrenamientos', 'Entrenamientos próximos (48 h)'],
            ['evaluaciones', 'Jugadores sin evaluar en el mes'],
          ] as const
        ).map(([k, label]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <p className="text-sm font-medium">{label}</p>
            <Switch checked={prefs[k]} onChange={() => loaded && toggle(k)} label="" />
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <div>
            <p className="text-sm font-medium">Registro de auditoría</p>
            <p className="text-xs text-zinc-500">Acciones importantes guardadas localmente.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/auditoria')}>
            <ScrollText className="h-4 w-4" /> Ver auditoría
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ---------- Datos / Backups ----------

function DataTab() {
  const [lastBackup, setLastBackup] = useState<string | undefined>();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [inspect, setInspect] = useState<ImportSummary | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [wiping, setWiping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    settingsService.getSetting<string>(SETTINGS_KEYS.lastBackupAt).then(setLastBackup);
  }, []);

  const inspectFile = async (f: File) => {
    setInspecting(true);
    const res = await backupService.inspectJson(f);
    setInspecting(false);
    setImportFile(f);
    setInspect(res);
  };

  const restore = async () => {
    if (!importFile) return;
    const ok = await confirmDialog({
      title: 'Restaurar información',
      message: 'Se reemplazarán TODOS los datos actuales por los del respaldo. ¿Continuar?',
      confirmLabel: 'Restaurar',
      danger: true,
    });
    if (!ok) return;
    setRestoring(true);
    try {
      const res = await backupService.importJson(importFile);
      if (res.valid) {
        toast.success(
          'Respaldo restaurado',
          `${Object.values(res.counts).reduce((a, b) => a + b, 0)} registros`,
        );
        setInspect(null);
        setImportFile(null);
      } else {
        toast.error('Archivo no válido', res.error);
      }
    } finally {
      setRestoring(false);
    }
  };

  const wipe = async () => {
    const ok1 = await confirmDialog({
      title: 'Eliminar TODOS los datos',
      message:
        'Esta acción borra jugadores, pagos, asistencias, configuración y usuarios locales. No se puede deshacer.',
      confirmLabel: 'Continuar',
      danger: true,
    });
    if (!ok1) return;
    const ok2 = await confirmDialog({
      title: 'Confirmación final',
      message: '¿Estás completamente seguro? Haz un respaldo antes si lo necesitas.',
      confirmLabel: 'Sí, borrar todo',
      danger: true,
    });
    if (!ok2) return;
    setWiping(true);
    try {
      await backupService.wipeAll();
      toast.success('Datos eliminados', 'La aplicación quedó como nueva.');
      setTimeout(() => window.location.reload(), 1200);
    } finally {
      setWiping(false);
    }
  };

  const reloadDemo = async () => {
    const ok = await confirmDialog({
      title: 'Restaurar demo',
      message:
        'Se cargarán datos de demostración. Los datos actuales se conservarán y pueden mezclarse. ¿Continuar?',
      confirmLabel: 'Cargar demo',
    });
    if (!ok) return;
    await seedDemo();
    toast.success('Datos demo cargados');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Copias de seguridad"
          subtitle={`Última copia: ${lastBackup ? formatDateTime(lastBackup) : 'nunca'}`}
        />
        <CardBody className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Tus datos se almacenan localmente en este dispositivo y navegador. Para evitar pérdida de
              información, realiza copias de seguridad periódicas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => backupService.exportJson()}>
              <Download className="h-4 w-4" /> Exportar datos (JSON)
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <HardDriveUpload className="h-4 w-4" /> Importar datos
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) inspectFile(f);
                e.target.value = '';
              }}
            />
          </div>

          {inspecting && <p className="text-sm text-zinc-500">Analizando archivo…</p>}
          {inspect && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              {inspect.valid ? (
                <>
                  <p className="text-sm font-semibold">Respaldo válido</p>
                  <p className="text-xs text-zinc-500">
                    Exportado: {inspect.exportedAt ? formatDateTime(inspect.exportedAt) : '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(inspect.counts)
                      .filter(([, n]) => n > 0)
                      .map(([t, n]) => (
                        <Badge key={t} tone="gray">
                          {t}: {n}
                        </Badge>
                      ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="danger" onClick={restore} loading={restoring}>
                      <HardDriveDownload className="h-4 w-4" /> Restaurar (reemplazar todo)
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        if (!importFile) return;
                        const res = await backupService.mergeJson(importFile);
                        if (res.valid) toast.success('Datos fusionados');
                        else toast.error('Archivo no válido', res.error);
                      }}
                    >
                      Fusionar sin borrar
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-600">{inspect.error}</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Exportar a Excel" subtitle="Descarga colecciones en formato .xlsx" />
        <CardBody className="flex flex-wrap gap-2">
          {(
            [
              ['jugadores', 'Jugadores'],
              ['pagos', 'Pagos'],
              ['asistencias', 'Asistencias'],
              ['finanzas', 'Finanzas'],
              ['evaluaciones', 'Evaluaciones'],
              ['ejercicios', 'Ejercicios'],
            ] as const
          ).map(([kind, label]) => (
            <Button key={kind} variant="secondary" size="sm" onClick={() => backupService.exportExcel(kind)}>
              <FileSpreadsheet className="h-4 w-4 text-brand-600" /> {label}
            </Button>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Zona peligrosa" />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <div>
              <p className="text-sm font-medium">Restaurar datos de demostración</p>
              <p className="text-xs text-zinc-500">Vuelve a cargar la escuela de ejemplo.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={reloadDemo}>
              <RefreshCw className="h-4 w-4" /> Cargar demo
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Eliminar todos los datos</p>
              <p className="text-xs text-red-500/80">
                Borra completamente la base local. Requiere doble confirmación.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={wipe} loading={wiping}>
              <Trash2 className="h-4 w-4" /> Borrar todo
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
