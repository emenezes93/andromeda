import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
// Dashboard
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
// Templates
const TemplatesListPage = lazy(() =>
  import('@/features/templates/TemplatesListPage').then((m) => ({ default: m.TemplatesListPage }))
);
const TemplateFormPage = lazy(() =>
  import('@/features/templates/TemplateFormPage').then((m) => ({ default: m.TemplateFormPage }))
);
const TemplateEditPage = lazy(() =>
  import('@/features/templates/TemplateEditPage').then((m) => ({ default: m.TemplateEditPage }))
);
const TemplateDetailPage = lazy(() =>
  import('@/features/templates/TemplateDetailPage').then((m) => ({ default: m.TemplateDetailPage }))
);
const TemplateReportPage = lazy(() =>
  import('@/features/templates/TemplateReportPage').then((m) => ({ default: m.TemplateReportPage }))
);
// Sessions
const SessionsListPage = lazy(() =>
  import('@/features/sessions/SessionsListPage').then((m) => ({ default: m.SessionsListPage }))
);
const PublicFillPage = lazy(() =>
  import('@/features/sessions/PublicFillPage').then((m) => ({ default: m.PublicFillPage }))
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
// Patients
const PatientsListPage = lazy(() =>
  import('@/features/patients/PatientsListPage').then((m) => ({ default: m.PatientsListPage }))
);
const PatientFormPage = lazy(() =>
  import('@/features/patients/PatientFormPage').then((m) => ({ default: m.PatientFormPage }))
);
const PatientDetailPage = lazy(() =>
  import('@/features/patients/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage }))
);
const PatientEvolutionPage = lazy(() =>
  import('@/features/patients/PatientEvolutionPage').then((m) => ({
    default: m.PatientEvolutionPage,
  }))
);
// Users
const UsersListPage = lazy(() =>
  import('@/features/users/UsersListPage').then((m) => ({ default: m.UsersListPage }))
);
const InviteUserPage = lazy(() =>
  import('@/features/users/InviteUserPage').then((m) => ({ default: m.InviteUserPage }))
);
// Tenants (owner only)
const TenantsListPage = lazy(() =>
  import('@/features/tenants/TenantsListPage').then((m) => ({ default: m.TenantsListPage }))
);
const TenantFormPage = lazy(() =>
  import('@/features/tenants/TenantFormPage').then((m) => ({ default: m.TenantFormPage }))
);
// Billing
const SubscriptionPage = lazy(() =>
  import('@/features/billing/SubscriptionPage').then((m) => ({ default: m.SubscriptionPage }))
);
// Audit
const AuditListPage = lazy(() =>
  import('@/features/audit/AuditListPage').then((m) => ({ default: m.AuditListPage }))
);
// Termos e política (LGPD)
const TermsPage = lazy(() =>
  import('@/features/terms/TermsPage').then((m) => ({ default: m.TermsPage }))
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
  {
    path: '/fill/:token',
    element: (
      <Suspense fallback={<FullPageSpinner />}>
        <PublicFillPage />
      </Suspense>
    ),
  },
  // Dashboard
  { path: '/', element: withLayout(undefined, <DashboardPage />) },
  // Templates (specific before dynamic)
  { path: '/templates', element: withLayout('Templates', <TemplatesListPage />) },
  { path: '/templates/new', element: withLayout('Novo template', <TemplateFormPage />) },
  { path: '/templates/:id/edit', element: withLayout('Editar template', <TemplateEditPage />) },
  { path: '/templates/:id/report', element: withLayout('Relatório', <TemplateReportPage />) },
  { path: '/templates/:id', element: withLayout(undefined, <TemplateDetailPage />) },
  // Sessions
  { path: '/sessions', element: withLayout('Sessões', <SessionsListPage />) },
  { path: '/sessions/new', element: withLayout('Nova sessão', <NewSessionPage />) },
  { path: '/sessions/:id', element: withLayout(undefined, <SessionDetailPage />) },
  { path: '/sessions/:id/flow', element: withLayout('Anamnese', <AnamnesisFlowPage />) },
  { path: '/sessions/:id/insights', element: withLayout('Insights', <SessionInsightsPage />) },
  // Patients (specific before dynamic)
  { path: '/patients', element: withLayout('Pacientes', <PatientsListPage />) },
  { path: '/patients/new', element: withLayout('Novo paciente', <PatientFormPage />) },
  { path: '/patients/:id/edit', element: withLayout('Editar paciente', <PatientFormPage />) },
  { path: '/patients/:id/evolution', element: withLayout('Evolução', <PatientEvolutionPage />) },
  { path: '/patients/:id', element: withLayout(undefined, <PatientDetailPage />) },
  // Users
  { path: '/users', element: withLayout('Usuários', <UsersListPage />) },
  { path: '/users/invite', element: withLayout('Convidar usuário', <InviteUserPage />) },
  // Tenants (owner only – guard inside page)
  { path: '/tenants', element: withLayout('Tenants', <TenantsListPage />) },
  { path: '/tenants/new', element: withLayout('Novo tenant', <TenantFormPage />) },
  // Assinatura (pagamento recorrente)
  { path: '/subscription', element: withLayout('Assinatura', <SubscriptionPage />) },
  // Audit
  { path: '/audit', element: withLayout('Auditoria', <AuditListPage />) },
  // Termos e política de privacidade
  { path: '/terms', element: withLayout('Termos e política', <TermsPage />) },
  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
