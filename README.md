# FútbolProZacatepec

PWA de administración integral para escuelas, academias y clubes de fútbol — con identidad visual inspirada en **Cañeros de Zacatepec**.

**100% frontend.** Sin backend, sin APIs externas, sin base de datos en la nube. Toda la información vive en el navegador del usuario mediante **IndexedDB** (Dexie.js), por lo que la aplicación funciona **completamente offline** después de la primera carga.

```
React + TypeScript
        ↓
   Servicios (capa de dominio)
        ↓
     Dexie.js
        ↓
    IndexedDB   →   futbolprozacatepec_db
```

## Stack

- **React 19 + TypeScript + Vite 7**
- **Tailwind CSS 4** (identidad Cañeros: verde, dorado, blanco)
- **Dexie.js** sobre IndexedDB — persistencia local real
- **React Router 7** — SPA con fallback configurado para Vercel
- **React Hook Form + Zod** — formularios y validaciones en español
- **Recharts** — gráficas del dashboard y radar de evaluaciones
- **jsPDF + AutoTable** — reportes PDF generados en el navegador
- **SheetJS (xlsx)** — exportación a Excel
- **vite-plugin-pwa + Workbox** — service worker, precache, instalación
- **Vitest + fake-indexeddb** — pruebas de servicios

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # desarrollo en http://localhost:5173
npm run build      # build de producción (tsc + vite + SW)
npm run preview    # servir el build localmente
npm test           # tests de servicios (fake-indexeddb)
npm run lint       # ESLint
npm run format     # Prettier
```

## Despliegue en Vercel

El proyecto es una app estática: conecta el repo a Vercel y listo.
`vercel.json` incluye el rewrite SPA (`/(.*) → /index.html`) para que las
rutas de React Router no devuelvan 404 al refrescar.

- Build command: `npm run build`
- Output directory: `dist`

## Módulos

| Módulo | Descripción |
|---|---|
| Dashboard | KPIs + gráficas de asistencia, finanzas, pagos y rendimiento |
| Jugadores | CRUD completo, foto comprimida local, perfil con historial |
| Categorías | Edades, formato F7/F11, conteo de jugadores |
| Entrenadores / Tutores / Equipos | CRUDs con asignaciones |
| Asistencias | Flujo categoría → sesión → marcado (presente/ausente/retardo/justificado) |
| Pagos | Mensualidades automáticas por periodo, cobros, parciales, vencidos |
| WhatsApp | Enlaces `wa.me` con mensajes automáticos (recordatorio, confirmación, asistencia, reporte) |
| Finanzas | Ingresos/gastos, balance, gráficas por categoría y evolución mensual |
| Ejercicios | Biblioteca de **+1,000 ejercicios** importados a IndexedDB, favoritos, filtros combinados |
| Entrenamientos | Constructor de sesiones (calentamiento/principal/juego/vuelta), duración automática, PDF |
| Pizarra táctica | "Rompecabezas" con formaciones 4-4-2, 4-3-3, etc. Drag & drop sobre la cancha. **F7** para Sub-7/Sub-13, **F11** solo para Sub-17 |
| Evaluaciones | Técnica/velocidad/táctica/físico/actitud (0–100), historial, radar y comparativa |
| Reportes | PDF por jugador con logo, asistencia, pagos, radar y observaciones. Descargar / imprimir / compartir (Web Share API) |
| Calendario | Eventos locales: entrenamientos, partidos, torneos, reuniones |
| Notificaciones | Centro interno: pagos pendientes/vencidos, evaluaciones, avisos |
| Configuración | Escuela, usuarios y roles locales, apariencia, mensualidad, **backup JSON**, exportación Excel, restauración demo, borrado total con doble confirmación |
| Auditoría | Registro local de acciones (crear/editar/eliminar, importar/exportar, inicios de sesión) |

## Usuarios locales (demo)

La autenticación es **solo local/simulada** — sirve para demostrar roles, no es
seguridad real. Las credenciales se almacenan en IndexedDB del navegador.

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Administrador (acceso total) |
| `coach` | `coach123` | Entrenador (jugadores, asistencia, entrenamientos, evaluaciones, reportes) |
| `padre` | `padre123` | Padre/Tutor (solo consulta) |

Al iniciar por primera vez se ofrece cargar **datos de demostración**
(categorías, entrenadores, ~40 jugadores, tutores, pagos, asistencias,
evaluaciones, entrenamientos y eventos) o comenzar vacío.

## PWA / Offline

- `manifest.webmanifest` + íconos maskable generados (`pwa-*.png`).
- Service worker generado por Workbox con **precache** de todos los assets.
- Indicador permanente: 🟢 En línea / 🔴 Sin conexión (todas las funciones siguen operando offline).
- Estrategia `autoUpdate`: el SW se actualiza solo al publicar una versión nueva.
- Instalable desde Chrome, Edge y Android ("Instalar app" en el menú).

## Copias de seguridad

Los datos son locales al dispositivo. En **Configuración → Datos**:

- **Exportar JSON**: `futbolprozacatepec-backup-AAAA-MM-DD.json` con todas las tablas.
- **Importar JSON**: valida estructura, muestra resumen y restaura tras confirmar.
- **Exportar Excel**: jugadores, pagos, asistencias, finanzas y evaluaciones (.xlsx).

> ⚠️ Los datos de esta versión se almacenan localmente en este dispositivo y
> navegador. Para evitar pérdida de información, realiza copias de seguridad
> periódicas.

## Arquitectura

```
src/
├── components/    ui (botones, tablas, modales), layout, dashboard, players, exercises
├── pages/         una carpeta por módulo (lazy-loaded)
├── db/            database.ts (Dexie), seed.ts (demo)
├── services/      una clase por entidad — único punto de acceso a IndexedDB
├── hooks/         useLiveQuery + hooks de dominio
├── stores/        zustand: auth, toasts, confirm, ui
├── data/          formations.ts, exercises.json (+1,000)
├── lib/           utils, image, session, pdf, validators (zod)
├── router/        rutas protegidas por rol
└── test/          setup (fake-indexeddb) + tests de servicios
```

Regla estricta: **los componentes nunca tocan IndexedDB** — solo
`Componente → Hook → Servicio → Dexie → IndexedDB`. Para una futura migración a
backend basta reescribir la capa de servicios manteniendo las firmas.

## Regenerar la biblioteca de ejercicios

```bash
node scripts/generate-exercises.mjs
```

Genera `src/data/exercises.json` (~1,260 ejercicios) que la app importa a
IndexedDB una sola vez al primer arranque.
