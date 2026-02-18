import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProtectedRoute } from './ProtectedRoute';

const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const TemplatesListPage = lazy(() =>
  import('@/features/templates/TemplatesListPage').then((m) => ({ default: m.TemplatesListPage }))
);
const TemplateFormPage = lazy(() =>
  import('@/features/templates/TemplateFormPage').then((m) => ({ default: m.TemplateFormPage }))
);
const TemplateDetailPage = lazy(() =>
  import('@/features/templates/TemplateDetailPage').then((m) => ({ default: m.TemplateDetailPage }))
);
const SessionsListPage = lazy(() =>
  import('@/features/sessions/SessionsListPage').then((m) => ({ default: m.SessionsListPage }))
);
const NewSessionPage = lazy(() =>
  import('@/features/sessions/NewSessionPage').then((m) => ({ default: m.NewSessionPage }))
);
const SessionDetailPage = lazy(() =>
  import('@/features/sessions/SessionDetailPage').then((m) => ({ default: m.SessionDetailPage }))
);
const AnamnesisFlowPage = lazy(() =>
  import('@/features/sessions/AnamnesisFlowPage').then((m) => ({ default: m.AnamnesisFlowPage }))
);
const SessionInsightsPage = lazy(() =>
  import('@/features/insights/SessionInsightsPage').then((m) => ({
    default: m.SessionInsightsPage,
  }))
);
const AuditListPage = lazy(() =>
  import('@/features/audit/AuditListPage').then((m) => ({ default: m.AuditListPage }))
);

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const withLayout = (title: string | undefined, children: React.ReactNode) => (
  <ProtectedRoute>
    <PageLayout title={title}>
      <Suspense fallback={<FullPageSpinner />}>{children}</Suspense>
    </PageLayout>
  </ProtectedRoute>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<FullPageSpinner />}>
        <LoginPage />
      </Suspense>
    ),
  },
  { path: '/', element: withLayout(undefined, <DashboardPage />) },
  { path: '/templates', element: withLayout('Templates', <TemplatesListPage />) },
  { path: '/templates/new', element: withLayout('Novo template', <TemplateFormPage />) },
  { path: '/templates/:id', element: withLayout(undefined, <TemplateDetailPage />) },
  { path: '/sessions', element: withLayout('Sessões', <SessionsListPage />) },
  { path: '/sessions/new', element: withLayout('Nova sessão', <NewSessionPage />) },
  { path: '/sessions/:id', element: withLayout(undefined, <SessionDetailPage />) },
  { path: '/sessions/:id/flow', element: withLayout('Anamnese', <AnamnesisFlowPage />) },
  { path: '/sessions/:id/insights', element: withLayout('Insights', <SessionInsightsPage />) },
  { path: '/audit', element: withLayout('Auditoria', <AuditListPage />) },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
