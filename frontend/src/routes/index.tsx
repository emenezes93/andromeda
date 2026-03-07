import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const SignupPage = lazy(() =>
  import('@/features/auth/SignupPage').then((m) => ({ default: m.SignupPage }))
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
const PatientTimelinePage = lazy(() =>
  import('@/features/patients/PatientTimelinePage').then((m) => ({
    default: m.PatientTimelinePage,
  }))
);
const PatientHubPage = lazy(() =>
  import('@/features/patients/PatientHubPage').then((m) => ({ default: m.PatientHubPage }))
);
const PatientReportPage = lazy(() =>
  import('@/features/patients/PatientReportPage').then((m) => ({
    default: m.PatientReportPage,
  }))
);
// Goals
const GoalFormPage = lazy(() =>
  import('@/features/goals/GoalFormPage').then((m) => ({ default: m.GoalFormPage }))
);
// Scheduled Questionnaires
const ScheduledQuestionnairesListPage = lazy(() =>
  import('@/features/scheduled-questionnaires/ScheduledQuestionnairesListPage').then((m) => ({
    default: m.ScheduledQuestionnairesListPage,
  }))
);
const ScheduledQuestionnaireFormPage = lazy(() =>
  import('@/features/scheduled-questionnaires/ScheduledQuestionnaireFormPage').then((m) => ({
    default: m.ScheduledQuestionnaireFormPage,
  }))
);
// Diet Plans
const DietPlansListPage = lazy(() =>
  import('@/features/diet/DietPlansListPage').then((m) => ({ default: m.DietPlansListPage }))
);
const DietPlanFormPage = lazy(() =>
  import('@/features/diet/DietPlanFormPage').then((m) => ({ default: m.DietPlanFormPage }))
);
const DietPlanDetailPage = lazy(() =>
  import('@/features/diet/DietPlanDetailPage').then((m) => ({ default: m.DietPlanDetailPage }))
);
const DietDashboardPage = lazy(() =>
  import('@/features/diet/DietDashboardPage').then((m) => ({ default: m.DietDashboardPage }))
);
// Training Plans
const TrainingPlansListPage = lazy(() =>
  import('@/features/training-plans/TrainingPlansListPage').then((m) => ({
    default: m.TrainingPlansListPage,
  }))
);
const TrainingPlanFormPage = lazy(() =>
  import('@/features/training-plans/TrainingPlanFormPage').then((m) => ({
    default: m.TrainingPlanFormPage,
  }))
);
const TrainingPlanDetailPage = lazy(() =>
  import('@/features/training-plans/TrainingPlanDetailPage').then((m) => ({
    default: m.TrainingPlanDetailPage,
  }))
);
// Exercises
const ExercisesListPage = lazy(() =>
  import('@/features/exercises/ExercisesListPage').then((m) => ({
    default: m.ExercisesListPage,
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
// AI Usage
const AiUsagePage = lazy(() =>
  import('@/features/ai/AiUsagePage').then((m) => ({ default: m.AiUsagePage }))
);
// Security (2FA)
const SecurityPage = lazy(() =>
  import('@/features/auth/SecurityPage').then((m) => ({ default: m.SecurityPage }))
);
const NotificationsSettingsPage = lazy(() =>
  import('@/features/settings/NotificationsSettingsPage').then((m) => ({
    default: m.NotificationsSettingsPage,
  }))
);
const OrganizationSettingsPage = lazy(() =>
  import('@/features/settings/OrganizationSettingsPage').then((m) => ({
    default: m.OrganizationSettingsPage,
  }))
);
// Onboarding
const OnboardingWizardPage = lazy(() =>
  import('@/features/onboarding/OnboardingWizardPage').then((m) => ({
    default: m.OnboardingWizardPage,
  }))
);
// Central de ajuda (Fase 3)
const HelpCenterPage = lazy(() =>
  import('@/features/help/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage }))
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
    path: '/signup',
    element: (
      <Suspense fallback={<FullPageSpinner />}>
        <SignupPage />
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
  // Dashboard (redirect legacy bookmark)
  { path: '/', element: withLayout(undefined, <DashboardPage />) },
  { path: '/dashboard', element: <Navigate to="/" replace /> },
  // Templates (specific before dynamic)
  { path: '/templates', element: withLayout('Templates', <TemplatesListPage />) },
  { path: '/templates/new', element: withLayout('Novo template', <TemplateFormPage />) },
  { path: '/templates/:id/edit', element: withLayout('Editar template', <TemplateEditPage />) },
  { path: '/templates/:id/report', element: withLayout('Relatório', <TemplateReportPage />) },
  { path: '/templates/:id', element: withLayout(undefined, <TemplateDetailPage />) },
  // Sessions
  { path: '/sessions', element: withLayout('Avaliações', <SessionsListPage />) },
  { path: '/sessions/new', element: withLayout('Nova avaliação', <NewSessionPage />) },
  { path: '/sessions/:id', element: withLayout(undefined, <SessionDetailPage />) },
  { path: '/sessions/:id/flow', element: withLayout('Anamnese', <AnamnesisFlowPage />) },
  { path: '/sessions/:id/insights', element: withLayout('Insights', <SessionInsightsPage />) },
  // Patients (specific before dynamic)
  { path: '/patients', element: withLayout('Pacientes', <PatientsListPage />) },
  { path: '/patients/new', element: withLayout('Novo paciente', <PatientFormPage />) },
  { path: '/patients/:id/edit', element: withLayout('Editar paciente', <PatientFormPage />) },
  { path: '/patients/:id/evolution', element: withLayout('Evolução', <PatientEvolutionPage />) },
  { path: '/patients/:id/timeline', element: withLayout('Histórico do Paciente', <PatientTimelinePage />) },
  { path: '/patients/:id/hub', element: withLayout('Hub do Paciente', <PatientHubPage />) },
  { path: '/patients/:id/report', element: withLayout('Relatório', <PatientReportPage />) },
  { path: '/patients/:id', element: withLayout(undefined, <PatientDetailPage />) },
  // Goals
  { path: '/goals/new', element: withLayout('Nova meta', <GoalFormPage />) },
  { path: '/goals/:id/edit', element: withLayout('Editar meta', <GoalFormPage />) },
  // Scheduled Questionnaires
  {
    path: '/scheduled-questionnaires',
    element: withLayout('Agendamentos', <ScheduledQuestionnairesListPage />),
  },
  {
    path: '/scheduled-questionnaires/new',
    element: withLayout('Novo agendamento', <ScheduledQuestionnaireFormPage />),
  },
  {
    path: '/scheduled-questionnaires/:id/edit',
    element: withLayout('Editar agendamento', <ScheduledQuestionnaireFormPage />),
  },
  // Diet Plans
  { path: '/diet-plans', element: withLayout('Planos de Dieta', <DietPlansListPage />) },
  { path: '/diet-plans/new', element: withLayout('Novo Plano de Dieta', <DietPlanFormPage />) },
  { path: '/diet-plans/:id/edit', element: withLayout('Editar Plano', <DietPlanFormPage />) },
  { path: '/diet-plans/:id', element: withLayout(undefined, <DietPlanDetailPage />) },
  { path: '/diet-dashboard/:patientId', element: withLayout('Dashboard Dieta', <DietDashboardPage />) },
  // Training Plans
  { path: '/exercises', element: withLayout('Biblioteca de exercícios', <ExercisesListPage />) },
  { path: '/training-plans', element: withLayout('Planos de Treino', <TrainingPlansListPage />) },
  {
    path: '/training-plans/new',
    element: withLayout('Novo Plano de Treino', <TrainingPlanFormPage />),
  },
  {
    path: '/training-plans/:id/edit',
    element: withLayout('Editar Plano', <TrainingPlanFormPage />),
  },
  {
    path: '/training-plans/:id',
    element: withLayout(undefined, <TrainingPlanDetailPage />),
  },
  // Users
  { path: '/users', element: withLayout('Usuários', <UsersListPage />) },
  { path: '/users/invite', element: withLayout('Convidar usuário', <InviteUserPage />) },
  // Tenants (owner only – guard inside page)
  { path: '/tenants', element: withLayout('Organizações', <TenantsListPage />) },
  { path: '/tenants/new', element: withLayout('Nova organização', <TenantFormPage />) },
  // Assinatura (pagamento recorrente)
  { path: '/subscription', element: withLayout('Assinatura', <SubscriptionPage />) },
  // Segurança (2FA)
  { path: '/settings/security', element: withLayout('Segurança', <SecurityPage />) },
  // Organização (logo, cor da marca)
  {
    path: '/settings/organization',
    element: withLayout('Organização', <OrganizationSettingsPage />),
  },
  // Notificações (alertas por email)
  {
    path: '/settings/notifications',
    element: withLayout('Notificações', <NotificationsSettingsPage />),
  },
  // Audit
  { path: '/audit', element: withLayout('Histórico de Atividades', <AuditListPage />) },
  // AI Usage
  { path: '/ai/usage', element: withLayout('Uso de IA', <AiUsagePage />) },
  // Termos e política de privacidade
  { path: '/terms', element: withLayout('Termos e política', <TermsPage />) },
  // Central de ajuda (Fase 3) — sem title no layout; página usa H1 "Central de ajuda"
  { path: '/help', element: withLayout(undefined, <HelpCenterPage />) },
  // Onboarding (no layout, no auth wrapper - just Suspense)
  {
    path: '/onboarding',
    element: (
      <Suspense fallback={<FullPageSpinner />}>
        <OnboardingWizardPage />
      </Suspense>
    ),
  },
  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
