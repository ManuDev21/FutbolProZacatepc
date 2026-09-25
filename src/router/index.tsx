import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore, can } from '@/stores/auth';
import { Skeleton } from '@/components/ui/misc';
import type { Role } from '@/types';

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/login/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const PlayersPage = lazy(() => import('@/pages/players/PlayersPage'));
const PlayerProfilePage = lazy(() => import('@/pages/players/PlayerProfilePage'));
const CategoriesPage = lazy(() => import('@/pages/categories/CategoriesPage'));
const CoachesPage = lazy(() => import('@/pages/coaches/CoachesPage'));
const GuardiansPage = lazy(() => import('@/pages/guardians/GuardiansPage'));
const TeamsPage = lazy(() => import('@/pages/teams/TeamsPage'));
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'));
const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage'));
const FinancePage = lazy(() => import('@/pages/finance/FinancePage'));
const ExercisesPage = lazy(() => import('@/pages/exercises/ExercisesPage'));
const TrainingsPage = lazy(() => import('@/pages/trainings/TrainingsPage'));
const TrainingBuilderPage = lazy(() => import('@/pages/trainings/TrainingBuilderPage'));
const TacticsPage = lazy(() => import('@/pages/tactics/TacticsPage'));
const EvaluationsPage = lazy(() => import('@/pages/evaluations/EvaluationsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const AuditPage = lazy(() => import('@/pages/audit/AuditPage'));

function PageLoader() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

/** Requiere sesión iniciada. */
function RequireAuth() {
  const { user, ready } = useAuthStore();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Requiere rol con acceso al área. */
function RequireRole({ area, roles }: { area: string; roles?: Role[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  if (!can(user.role, area)) return <Navigate to="/app" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <S>
        <LandingPage />
      </S>
    ),
  },
  {
    path: '/login',
    element: (
      <S>
        <LoginPage />
      </S>
    ),
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: (
              <S>
                <DashboardPage />
              </S>
            ),
          },
          {
            element: <RequireRole area="jugadores" />,
            children: [
              {
                path: 'jugadores',
                element: (
                  <S>
                    <PlayersPage />
                  </S>
                ),
              },
              {
                path: 'jugadores/:id',
                element: (
                  <S>
                    <PlayerProfilePage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="asistencias" />,
            children: [
              {
                path: 'asistencias',
                element: (
                  <S>
                    <AttendancePage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="pagos" />,
            children: [
              {
                path: 'pagos',
                element: (
                  <S>
                    <PaymentsPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="finanzas" />,
            children: [
              {
                path: 'finanzas',
                element: (
                  <S>
                    <FinancePage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="ejercicios" />,
            children: [
              {
                path: 'ejercicios',
                element: (
                  <S>
                    <ExercisesPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="entrenamientos" />,
            children: [
              {
                path: 'entrenamientos',
                element: (
                  <S>
                    <TrainingsPage />
                  </S>
                ),
              },
              {
                path: 'entrenamientos/:id',
                element: (
                  <S>
                    <TrainingBuilderPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="pizarra" />,
            children: [
              {
                path: 'pizarra',
                element: (
                  <S>
                    <TacticsPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="evaluaciones" />,
            children: [
              {
                path: 'evaluaciones',
                element: (
                  <S>
                    <EvaluationsPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="reportes" />,
            children: [
              {
                path: 'reportes',
                element: (
                  <S>
                    <ReportsPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="calendario" />,
            children: [
              {
                path: 'calendario',
                element: (
                  <S>
                    <CalendarPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="notificaciones" />,
            children: [
              {
                path: 'notificaciones',
                element: (
                  <S>
                    <NotificationsPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="categorias" roles={['admin']} />,
            children: [
              {
                path: 'categorias',
                element: (
                  <S>
                    <CategoriesPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="entrenadores" roles={['admin']} />,
            children: [
              {
                path: 'entrenadores',
                element: (
                  <S>
                    <CoachesPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="tutores" roles={['admin']} />,
            children: [
              {
                path: 'tutores',
                element: (
                  <S>
                    <GuardiansPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="equipos" roles={['admin']} />,
            children: [
              {
                path: 'equipos',
                element: (
                  <S>
                    <TeamsPage />
                  </S>
                ),
              },
            ],
          },
          {
            element: <RequireRole area="configuracion" roles={['admin']} />,
            children: [
              {
                path: 'configuracion',
                element: (
                  <S>
                    <SettingsPage />
                  </S>
                ),
              },
              {
                path: 'auditoria',
                element: (
                  <S>
                    <AuditPage />
                  </S>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
