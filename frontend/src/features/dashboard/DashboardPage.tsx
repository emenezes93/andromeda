import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoredUser } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { shouldShowOnboardingCta, dismissOnboardingCta } from '@/stores/onboardingStore';
import { listSessions } from '@/api/sessions';
import { listPatients } from '@/api/patients';
import { listGoals } from '@/api/goals';
import { listTrainingPlans } from '@/api/training-plans';
import { getDashboardStats } from '@/api/stats';
import { getSubscription } from '@/api/billing';
import { StudentsOverviewCard } from '@/features/dashboard/StudentsOverviewCard';
import { AnalyticsDashboardCard } from '@/features/dashboard/AnalyticsDashboardCard';
import type { Session } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';
import { IconSessions, IconTemplates, IconPatients, IconGoals } from '@/components/icons';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  SessionsByDayChart,
  SessionsByTemplateChart,
  type DayCount,
  type TemplateCount,
} from '@/components/charts';
import { AchievementsCard } from '@/components/gamification/AchievementsCard';
import { PlanUsageCard } from '@/components/ui/PlanUsageCard';
import { NotificationsWidget } from '@/components/ui/NotificationsWidget';
import { track } from '@/lib/analytics';

const MAX_NEXT_ACTIONS = 5;

interface NextAction {
  id: string;
  label: string;
  href: string;
  type:
    | 'session_continue'
    | 'patient_attention'
    | 'first_template'
    | 'first_patient'
    | 'first_session'
    | 'invite_user'
    | 'first_training_plan'
    | 'pending_evolution'
    | 'goal_expiring';
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
] as const;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardPage() {
  const user = getStoredUser();
  const { t } = useTranslation();
  const [periodDays, setPeriodDays] = useState<number>(30);

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['dashboard-sessions'],
    queryFn: () => listSessions({ page: 1, limit: 5 }),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats', periodDays],
    queryFn: () => getDashboardStats({ days: periodDays }),
  });

  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['dashboard-patients'],
    queryFn: () => listPatients({ page: 1, limit: 500 }),
  });

  const { data: goalsData, isLoading: loadingGoals } = useQuery({
    queryKey: ['dashboard-goals'],
    queryFn: () => listGoals({ limit: 1 }),
  });

  const { data: goalsListData } = useQuery({
    queryKey: ['dashboard-goals-list'],
    queryFn: () => listGoals({ limit: 50 }),
  });

  const { data: trainingPlansData } = useQuery({
    queryKey: ['dashboard-training-plans'],
    queryFn: () => listTrainingPlans({ page: 1, limit: 1 }),
  });

  const { data: subscription } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: getSubscription,
  });

  const { data: sessionsForAttention } = useQuery({
    queryKey: ['dashboard-sessions-recent'],
    queryFn: () => listSessions({ page: 1, limit: 1000 }),
  });

  const { data: inProgressSessionsData } = useQuery({
    queryKey: ['dashboard-sessions-in-progress'],
    queryFn: () => listSessions({ page: 1, limit: 5, status: 'in_progress' }),
  });

  const loading = loadingSessions || loadingStats;
  const sessions: Session[] = sessionsData?.data ?? [];
  const inProgressSessions: Session[] = inProgressSessionsData?.data ?? [];
  const totalSessions = stats?.totals.sessions ?? null;
  const totalTemplates = stats?.totals.templates ?? null;
  const totalPatients = patientsData?.meta.total ?? null;
  const completedCount = stats?.totals.completed ?? null;
  const byDay = stats?.byDay ?? {};
  const byTemplate = stats?.byTemplate ?? [];

  const byDayFormatted: DayCount[] = useMemo(() => {
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        count,
      }));
  }, [byDay]);

  const byTemplateFormatted: TemplateCount[] = useMemo(() => {
    return byTemplate.map((item) => ({
      name: item.templateName,
      count: item.count,
    }));
  }, [byTemplate]);

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return Object.entries(byDay).reduce((acc, [date, count]) => {
      const d = new Date(date);
      if (d >= weekAgo && d <= now) return acc + count;
      return acc;
    }, 0);
  }, [byDay]);

  const patientsNeedingAttention = useMemo(() => {
    const patients = patientsData?.data ?? [];
    const sessionsList = sessionsForAttention?.data ?? [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const patientIdsWithRecentSession = new Set(
      sessionsList
        .filter((s) => s.createdAt && new Date(s.createdAt) >= cutoff && s.patientId)
        .map((s) => s.patientId!)
    );
    return patients.filter((p) => !patientIdsWithRecentSession.has(p.id));
  }, [patientsData?.data, sessionsForAttention?.data]);

  const goalsExpiringSoon = useMemo(() => {
    const goals = goalsListData?.data ?? [];
    const now = new Date();
    const inDays = 14;
    const cutoff = new Date(now.getTime() + inDays * 24 * 60 * 60 * 1000);
    return goals.filter((g) => {
      const d = new Date(g.targetDate);
      return d >= now && d <= cutoff;
    });
  }, [goalsListData?.data]);

  const totalTrainingPlans = trainingPlansData?.meta?.total ?? 0;

  const nextActions = useMemo((): NextAction[] => {
    const actions: NextAction[] = [];
    inProgressSessions.forEach((s) => {
      if (actions.length >= MAX_NEXT_ACTIONS) return;
      actions.push({
        id: `session-${s.id}`,
        label: `Continuar: ${s.template?.name ?? 'Questionário'}${s.patient ? ` — ${s.patient.fullName}` : ''}`,
        href: `/sessions/${s.id}/flow`,
        type: 'session_continue',
      });
    });
    patientsNeedingAttention.slice(0, MAX_NEXT_ACTIONS - actions.length).forEach((p) => {
      if (actions.length >= MAX_NEXT_ACTIONS) return;
      actions.push({
        id: `patient-${p.id}`,
        label: `Avaliar: ${p.fullName}`,
        href: `/patients/${p.id}`,
        type: 'patient_attention',
      });
    });
    const firstForEvolution = patientsNeedingAttention.find(
      (p) => !actions.some((a) => a.id === `patient-${p.id}`)
    );
    if (firstForEvolution && actions.length < MAX_NEXT_ACTIONS) {
      actions.push({
        id: `evolution-${firstForEvolution.id}`,
        label: `Registrar evolução de ${firstForEvolution.fullName}`,
        href: `/patients/${firstForEvolution.id}/evolution`,
        type: 'pending_evolution',
      });
    }
    const patientsMap = new Map((patientsData?.data ?? []).map((p) => [p.id, p]));
    goalsExpiringSoon.slice(0, 2).forEach((g) => {
      if (actions.length >= MAX_NEXT_ACTIONS) return;
      const patientName = patientsMap.get(g.patientId)?.fullName ?? 'aluno';
      const daysLeft = Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      actions.push({
        id: `goal-${g.id}`,
        label: `Meta de ${patientName} vence em ${daysLeft} dias`,
        href: `/goals/${g.id}/edit`,
        type: 'goal_expiring',
      });
    });
    if (actions.length < MAX_NEXT_ACTIONS && totalTrainingPlans === 0) {
      actions.push({
        id: 'first-training-plan',
        label: 'Monte seu primeiro plano de treino',
        href: '/training-plans/new',
        type: 'first_training_plan',
      });
    }
    if (actions.length < MAX_NEXT_ACTIONS && (totalTemplates ?? 0) === 0) {
      actions.push({
        id: 'first-template',
        label: 'Criar seu primeiro template de anamnese',
        href: '/templates/new',
        type: 'first_template',
      });
    }
    if (actions.length < MAX_NEXT_ACTIONS && (totalPatients ?? 0) === 0) {
      actions.push({
        id: 'first-patient',
        label: 'Cadastrar seu primeiro paciente',
        href: '/patients/new',
        type: 'first_patient',
      });
    }
    if (actions.length < MAX_NEXT_ACTIONS && (totalSessions ?? 0) === 0) {
      actions.push({
        id: 'first-session',
        label: 'Iniciar sua primeira avaliação',
        href: '/sessions/new',
        type: 'first_session',
      });
    }
    if (actions.length < MAX_NEXT_ACTIONS && user?.role === 'owner') {
      actions.push({
        id: 'invite-user',
        label: 'Convidar usuário',
        href: '/users/invite',
        type: 'invite_user',
      });
    }
    return actions.slice(0, MAX_NEXT_ACTIONS);
  }, [
    inProgressSessions,
    patientsNeedingAttention,
    goalsExpiringSoon,
    patientsData?.data,
    totalTrainingPlans,
    totalTemplates,
    totalPatients,
    totalSessions,
    user?.role,
  ]);

  const showOnboardingCta = shouldShowOnboardingCta();

  const isEmptyState =
    (totalTemplates ?? 0) === 0 && (totalPatients ?? 0) === 0 && (totalSessions ?? 0) === 0;

  // Instrumentar visualização do painel Próximas ações
  const hasTrackedNextActionsView = useRef(false);
  useEffect(() => {
    if (loading || hasTrackedNextActionsView.current) return;
    hasTrackedNextActionsView.current = true;
    track({ name: 'next_actions_viewed', count: nextActions.length });
  }, [loading, nextActions.length]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const activeGoals = goalsData?.meta.total ?? null;

  const greeting = getGreeting();

  const trialActive =
    subscription?.trialEndsAt &&
    new Date(subscription.trialEndsAt) > new Date() &&
    subscription.status !== 'active' &&
    subscription.status !== 'trialing';
  const trialDaysLeft = trialActive && subscription?.trialEndsAt
    ? Math.ceil(
        (new Date(subscription.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      )
    : 0;

  return (
    <div className="space-y-8">
      {trialActive && (
        <div
          role="region"
          aria-label="Período de teste"
          className="rounded-button border border-warning bg-warning-subtle px-4 py-3 text-body text-warning"
        >
          Teste grátis por mais {trialDaysLeft} dias.{' '}
          <Link to="/subscription" className="font-medium underline hover:no-underline">
            Assine agora
          </Link>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading font-semibold text-content">
            {greeting}, <span className="text-primary">{user?.name || user?.email}</span>
          </h1>
          <p className="text-body-sm text-content-muted">
            {t.dashboard.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[8rem]">
            <Select
              id="period"
              label={t.dashboard.period}
              options={PERIOD_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label }))}
              value={String(periodDays)}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="py-1.5 text-body-sm"
            />
          </div>
          <Link to="/sessions/new">
            <Button size="sm">{t.dashboard.newSession}</Button>
          </Link>
        </div>
      </div>

      {/* Estado vazio: 0 templates, 0 pacientes, 0 sessões */}
      {!loading && isEmptyState && (
        <Card padding="md" className="border-primary/20 bg-primary-subtle/30">
          <div className="flex flex-col items-center text-center">
            <div
              className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"
              aria-hidden
            >
              <IconTemplates className="size-10" />
            </div>
            <h2 className="text-heading-sm font-semibold text-content">
              Tudo pronto para começar
            </h2>
            <p className="mt-1 text-body-sm text-content-muted">
              Escolha um dos passos abaixo para dar os primeiros passos na plataforma.
            </p>
            <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
              <Link to="/templates" className="block w-full">
                <Button variant="tactile" className="w-full">
                  Explorar templates prontos
                </Button>
              </Link>
              <Link to="/patients/new" className="block w-full">
                <Button variant="outline" className="w-full">
                  Cadastrar primeiro aluno
                </Button>
              </Link>
              <Link to="/help" className="block w-full">
                <Button variant="ghost" className="w-full">
                  Ver central de ajuda
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Ações rápidas: onboarding CTA + Próximas ações */}
      <section aria-labelledby="dashboard-acoes-heading">
        <h2 id="dashboard-acoes-heading" className="sr-only">
          Ações rápidas
        </h2>
        {showOnboardingCta && (
          <div
            role="region"
            aria-label="Complete sua configuração"
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary/30 bg-primary-subtle/50 px-4 py-3 mb-4"
          >
            <p className="text-body-sm text-content">
              {t.dashboard.onboardingCtaTitle}
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/onboarding"
                className="inline-flex min-h-touch items-center justify-center rounded-button bg-primary px-3 py-2 text-body-sm font-medium text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t.dashboard.onboardingCtaButton}
              </Link>
              <button
                type="button"
                onClick={() => dismissOnboardingCta()}
                className="rounded-button px-2 py-1.5 text-body-sm text-content-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t.dashboard.onboardingCtaDismiss}
              >
                {t.dashboard.onboardingCtaDismiss}
              </button>
            </div>
          </div>
        )}

      {/* Próximas ações — máx. 5 itens, deep-links, estado vazio, segmentação owner (invite user) */}
      <Card title="Próximas ações" padding="md" className="border-l-4 border-l-primary">
        {loading && nextActions.length === 0 ? (
          <div className="flex items-center gap-2 text-body-sm text-content-muted">
            <Skeleton height={24} width={24} className="shrink-0 rounded" />
            <Skeleton height={20} width={200} />
          </div>
        ) : nextActions.length === 0 ? (
          <div>
            <p className="text-body text-content">
              {t.dashboard.nextActionsEmpty}
            </p>
            <p className="mt-1 text-body-sm text-content-muted">
              {t.dashboard.nextActionsEmptySub}
            </p>
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Próximas ações">
            {nextActions.map((action) => (
              <li key={action.id}>
                <Link
                  to={action.href}
                  onClick={() =>
                    track({
                      name: 'dashboard_first_action',
                      actionType: action.type,
                      targetId: action.id,
                    })
                  }
                  className="flex items-center gap-2 rounded-button px-2 py-1.5 text-body font-medium text-primary hover:bg-primary-subtle transition-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="shrink-0 text-content-muted">→</span>
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      </section>

      {/* Visão geral — métricas */}
      <section aria-labelledby="dashboard-metricas-heading">
        <h2 id="dashboard-metricas-heading" className="mb-4 text-heading-sm font-semibold text-content">
          Visão geral
        </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconSessions className="size-5" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-muted">{t.dashboard.totalSessions}</p>
              {loading ? (
                <Skeleton height={32} width={60} className="mt-1" />
              ) : (
                <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{totalSessions ?? 0}</p>
              )}
            </div>
          </div>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconTemplates className="size-5" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-muted">{t.dashboard.activeTemplates}</p>
              {loading ? (
                <Skeleton height={32} width={60} className="mt-1" />
              ) : (
                <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{totalTemplates ?? 0}</p>
              )}
            </div>
          </div>
        </Card>
        <Link to="/patients" className="block focus-visible:outline-none">
          <Card padding="md" className="h-full border-l-4 border-l-success transition-calm hover:shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <IconPatients className="size-5" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-content-muted">{t.dashboard.patients}</p>
                {loadingPatients ? (
                  <Skeleton height={32} width={60} className="mt-1" />
                ) : (
                  <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{totalPatients ?? 0}</p>
                )}
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/goals/new" className="block focus-visible:outline-none">
          <Card padding="md" className="h-full border-l-4 border-l-warning transition-calm hover:shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <IconGoals className="size-5" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-content-muted">{t.dashboard.activeGoals}</p>
                {loadingGoals ? (
                  <Skeleton height={32} width={60} className="mt-1" />
                ) : (
                  <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{activeGoals ?? 0}</p>
                )}
              </div>
            </div>
          </Card>
        </Link>
      </div>
      </section>

      <AnalyticsDashboardCard periodDays={periodDays} />

      {/* Meus alunos (semana) — aderência treino/dieta + atenção, link para hub */}
      <StudentsOverviewCard />

      {/* Pacientes que precisam de atenção (sem avaliação em 30+ dias) */}
      {patientsNeedingAttention.length > 0 && (
        <Card title="Pacientes que precisam de atenção" padding="md" className="border-l-4 border-l-warning">
          <p className="text-body-sm text-content-muted mb-3">
            Sem avaliação nos últimos 30 dias. Vale uma nova consulta ou lembrete.
          </p>
          <ul className="space-y-1.5">
            {patientsNeedingAttention.slice(0, 10).map((p) => (
              <li key={p.id}>
                <Link
                  to={`/patients/${p.id}`}
                  className="text-body font-medium text-primary hover:underline"
                >
                  {p.fullName}
                </Link>
              </li>
            ))}
          </ul>
          {patientsNeedingAttention.length > 10 && (
            <p className="mt-2 text-body-sm text-content-muted">
              + {patientsNeedingAttention.length - 10} outros
            </p>
          )}
          <Link to="/patients" className="mt-3 inline-block">
            <Button variant="secondary" size="sm">
              Ver todos os pacientes
            </Button>
          </Link>
        </Card>
      )}

      {/* Alertas / Notificações */}
      <NotificationsWidget />

      {/* Uso do plano */}
      <PlanUsageCard />

      {/* Conquistas (gamificação) */}
      <AchievementsCard
        completedTotal={completedCount}
        completedThisWeek={completedThisWeek}
        loading={loading}
      />

      {/* Gráficos interativos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t.dashboard.sessionsByDay} padding="md">
          <SessionsByDayChart data={byDayFormatted} loading={loading} />
        </Card>
        <Card title={t.dashboard.sessionsByTemplate} padding="md">
          <SessionsByTemplateChart data={byTemplateFormatted} loading={loading} />
        </Card>
      </div>

      {/* Atividade recente */}
      <section aria-labelledby="dashboard-atividade-heading">
        <h2 id="dashboard-atividade-heading" className="mb-4 text-heading-sm font-semibold text-content">
          Atividade recente
        </h2>
      <Card title={t.dashboard.recentSessions} padding="none">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-5 py-8 text-body text-content-muted">
            {t.dashboard.noSessionsYet}{' '}
            <Link to="/sessions/new" className="font-medium text-primary hover:underline">
              {t.dashboard.createFirstSession}
            </Link>
          </p>
        ) : (
          <>
            {/* Mobile: cards (evitar link aninhado: div com dois links de ação) */}
            <ul className="md:hidden divide-y divide-border-muted">
              {sessions.map((s) => (
                <li key={s.id} className="px-4 py-3 transition-calm hover:bg-surface-muted">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-content">
                      {s.template?.name ?? s.templateId.slice(0, 8)}
                    </span>
                    {s.status && <SessionStatusBadge status={s.status} />}
                  </div>
                  <p className="mt-1 text-body-sm text-content-muted">
                    {formatDate(s.createdAt)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Link to={`/sessions/${s.id}`}>
                      <Button variant="ghost" size="sm">
                        {t.dashboard.view}
                      </Button>
                    </Link>
                    <Link to={`/sessions/${s.id}/flow`}>
                      <Button size="sm" variant="tactile">{t.dashboard.continue}</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-border-muted bg-surface-muted">
                    <th className="px-4 py-3 font-medium text-content-muted">{t.dashboard.date}</th>
                    <th className="px-4 py-3 font-medium text-content-muted">{t.dashboard.template}</th>
                    <th className="px-4 py-3 font-medium text-content-muted">{t.dashboard.status}</th>
                    <th className="px-4 py-3 font-medium text-content-muted">ID</th>
                    <th className="px-4 py-3 text-right font-medium text-content-muted">{t.dashboard.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border-muted transition-calm hover:bg-surface-muted"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-content">
                        {s.template?.name ?? s.templateId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        {s.status && <SessionStatusBadge status={s.status} />}
                      </td>
                      <td className="px-4 py-3 font-mono text-content-subtle">
                        {s.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/sessions/${s.id}`} className="mr-2">
                          <Button variant="ghost" size="sm">
                            {t.dashboard.view}
                          </Button>
                        </Link>
                        <Link to={`/sessions/${s.id}/flow`}>
                          <Button size="sm" variant="tactile">{t.dashboard.continue}</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!loading && sessions.length > 0 && (
          <div className="border-t border-border-muted px-4 py-3">
            <Link to="/sessions" className="text-body-sm font-medium text-primary hover:underline">
              {t.dashboard.viewAllSessions}
          </Link>
        </div>
        )}
      </Card>
      </section>
    </div>
  );
}
