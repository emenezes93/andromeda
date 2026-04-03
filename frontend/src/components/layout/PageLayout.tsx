import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import { clearAuth, getStoredUser } from '@/stores/authStore';
import { getSubscription } from '@/api/billing';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IconDashboard,
  IconTemplates,
  IconSessions,
  IconAudit,
  IconLogout,
  IconPulse,
  IconPatients,
  IconUsers,
  IconTenants,
  IconSubscription,
  IconShield,
  IconBell,
  IconDiet,
  IconMenu,
  IconX,
  IconChevronDown,
  IconHelp,
} from '@/components/icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import { track } from '@/lib/analytics';

const AlertsBell = lazy(() =>
  import('@/components/ui/AlertsBell').then((m) => ({ default: m.AlertsBell })),
);

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

/** Classe para itens do menu principal — WCAG 2.5.5: min 44px; estado ativo com borda esquerda (BRANDING 9.2) */
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-touch flex items-center gap-3 rounded-button py-2.5 pr-3 text-body-sm font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
    isActive
      ? 'bg-primary-subtle text-primary border-l-4 border-l-primary pl-2'
      : 'text-content-muted hover:bg-primary-subtle hover:text-content border-l-4 border-l-transparent pl-3'
  }`;

/** Classe para itens de submenu — indentação e borda sutil para hierarquia */
const navSubLinkClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-touch flex items-center gap-3 rounded-button border-l-2 pl-4 pr-3 py-2.5 text-body-sm font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
    isActive
      ? 'bg-primary-subtle text-primary border-l-primary'
      : 'border-l-transparent text-content-muted hover:bg-surface-muted hover:text-content hover:border-l-primary/40'
  }`;

const REFRESH_INTERVAL_MS = 12 * 60 * 1000; // 12 min — token expires in 15 min

export function PageLayout({ children, title }: PageLayoutProps) {
  const user = getStoredUser();

  // Proactive token refresh so long flows (e.g. assessment) don't hit 401
  useEffect(() => {
    if (!user) return;
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const run = () => {
      fetch(`${apiUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
      })
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data?.token) {
            localStorage.setItem('token', data.token);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          }
        })
        .catch(() => {});
    };
    const id = setInterval(run, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user]);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [planosExpanded, setPlanosExpanded] = useState(true);
  const [relatoriosExpanded, setRelatoriosExpanded] = useState(true);
  const [navBannerDismissed, setNavBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('navRedesignBannerDismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('trialBannerDismissed') === 'true';
    } catch {
      return false;
    }
  });
  const { data: subscription } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: getSubscription,
  });
  const { t, locale, setLocale } = useTranslation();

  const trialActive =
    subscription?.trialEndsAt &&
    new Date(subscription.trialEndsAt) > new Date() &&
    subscription.status !== 'active' &&
    subscription.status !== 'trialing';
  const trialDaysLeft =
    trialActive && subscription?.trialEndsAt
      ? Math.ceil(
          (new Date(subscription.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        )
      : 0;
  const showTrialBanner = trialActive && trialDaysLeft <= 7 && !trialBannerDismissed;

  const dismissTrialBanner = () => {
    setTrialBannerDismissed(true);
    try {
      sessionStorage.setItem('trialBannerDismissed', 'true');
    } catch {}
  };

  // Fecha sidebar ao navegar em mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // R2: evento page_viewed para métricas de encontrabilidade
  useEffect(() => {
    track({ name: 'page_viewed', route: location.pathname, context: title });
  }, [location.pathname, title]);

  // Expande Planos / Relatórios quando a rota está dentro deles
  useEffect(() => {
    if (location.pathname.startsWith('/diet-plans') || location.pathname.startsWith('/training-plans') || location.pathname.startsWith('/exercises') || location.pathname.startsWith('/scheduled-questionnaires')) {
      setPlanosExpanded(true);
    }
    if (location.pathname.startsWith('/audit') || location.pathname.startsWith('/ai/usage')) {
      setRelatoriosExpanded(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';
  const isOwner = user?.role === 'owner';

  const dismissNavBanner = () => {
    setNavBannerDismissed(true);
    try {
      localStorage.setItem('navRedesignBannerDismissed', 'true');
    } catch {}
  };

  const isInPlanos = location.pathname.startsWith('/diet-plans') || location.pathname.startsWith('/training-plans') || location.pathname.startsWith('/exercises') || location.pathname.startsWith('/scheduled-questionnaires');
  const isInRelatorios = location.pathname.startsWith('/audit') || location.pathname.startsWith('/ai/usage');

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: t.roles.owner,
      admin: t.roles.admin,
      practitioner: t.roles.practitioner,
      viewer: t.roles.viewer,
    };
    return labels[role] ?? role;
  };

  const onNavClick = (item: string, origin: 'sidebar' | 'mobile') => () =>
    track({ name: 'nav_item_clicked', item, origin });

  const renderSidebarContent = (origin: 'sidebar' | 'mobile') => (
    <>
      {/* Logo — em mobile, padding à direita para não sobrepor o botão fechar */}
      <div
        className={`flex h-14 shrink-0 items-center gap-2 border-b border-border-muted px-4 ${origin === 'mobile' ? 'pr-12' : ''}`}
      >
        <Link
          to="/"
          onClick={onNavClick('/', origin)}
          className="flex items-center gap-2 rounded-button transition-calm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="text-white">
            <IconPulse className="size-8 shrink-0" />
          </span>
          <span className="text-heading-sm font-semibold text-primary">Fit Insight</span>
        </Link>
      </div>

      {/* Nav — Fase 2: 6 itens orientados a tarefas + tooltips + submenus Planos e Relatórios */}
      <nav
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3"
        aria-label="Navegação principal"
      >
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-content-subtle" role="presentation">
          Uso diário
        </p>
        <NavLink to="/" end className={navLinkClass} title={t.nav.tooltipInicio} onClick={onNavClick('/', origin)}>
          <IconDashboard />
          {t.nav.taskInicio}
        </NavLink>
        <NavLink to="/patients" className={navLinkClass} title={t.nav.tooltipPacientes} onClick={onNavClick('/patients', origin)}>
          <IconPatients />
          {t.nav.taskPacientes}
        </NavLink>
        <NavLink to="/sessions" className={navLinkClass} title={t.nav.tooltipAvaliacoes} onClick={onNavClick('/sessions', origin)}>
          <IconSessions />
          {t.nav.taskAvaliacoes}
        </NavLink>
        <NavLink to="/templates" className={navLinkClass} title={t.nav.tooltipQuestionarios} onClick={onNavClick('/templates', origin)}>
          <IconTemplates />
          {t.nav.taskQuestionarios}
        </NavLink>
        <div>
          <button
            type="button"
            onClick={() => setPlanosExpanded((e) => !e)}
            className={`min-h-touch w-full flex items-center justify-between gap-2 rounded-button px-3 py-2.5 text-body-sm font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isInPlanos ? 'bg-primary-subtle text-primary' : 'text-content-muted hover:bg-primary-subtle hover:text-content'
            }`}
            title={t.nav.tooltipPlanos}
            aria-expanded={planosExpanded}
            aria-controls="nav-planos"
            aria-label={planosExpanded ? 'Recolher Planos' : 'Expandir Planos: Dieta, Treino, Agendamentos'}
          >
            <span className="flex items-center gap-3">
              <IconDiet />
              {t.nav.taskPlanos}
            </span>
            <IconChevronDown className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${planosExpanded ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          <div id="nav-planos" className="mt-0.5 flex flex-col gap-0.5" hidden={!planosExpanded} role="group" aria-label={t.nav.taskPlanos}>
            <NavLink to="/diet-plans" className={navSubLinkClass} onClick={onNavClick('/diet-plans', origin)}>{t.nav.planosDieta}</NavLink>
            <NavLink to="/training-plans" className={navSubLinkClass} onClick={onNavClick('/training-plans', origin)}>{t.nav.planosTreino}</NavLink>
            <NavLink to="/exercises" className={navSubLinkClass} onClick={onNavClick('/exercises', origin)}>{t.nav.planosExercicios}</NavLink>
            <NavLink to="/scheduled-questionnaires" className={navSubLinkClass} onClick={onNavClick('/scheduled-questionnaires', origin)}>{t.nav.planosAgendamentos}</NavLink>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setRelatoriosExpanded((e) => !e)}
            className={`min-h-touch w-full flex items-center justify-between gap-2 rounded-button px-3 py-2.5 text-body-sm font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isInRelatorios ? 'bg-primary-subtle text-primary' : 'text-content-muted hover:bg-primary-subtle hover:text-content'
            }`}
            title={t.nav.tooltipRelatorios}
            aria-expanded={relatoriosExpanded}
            aria-controls="nav-relatorios"
            aria-label={relatoriosExpanded ? 'Recolher Relatórios' : 'Expandir Relatórios: Histórico de atividades, Uso de IA'}
          >
            <span className="flex items-center gap-3">
              <IconAudit />
              {t.nav.taskRelatorios}
            </span>
            <IconChevronDown className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${relatoriosExpanded ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          <div id="nav-relatorios" className="mt-0.5 flex flex-col gap-0.5" hidden={!relatoriosExpanded} role="group" aria-label={t.nav.taskRelatorios}>
            <NavLink to="/audit" className={navSubLinkClass} onClick={onNavClick('/audit', origin)}>{t.nav.relatoriosHistorico}</NavLink>
            <NavLink to="/ai/usage" className={navSubLinkClass} onClick={onNavClick('/ai/usage', origin)}>{t.nav.relatoriosUsoIa}</NavLink>
          </div>
        </div>
        <NavLink to="/help" className={navLinkClass} title="Central de ajuda e FAQ" onClick={onNavClick('/help', origin)}>
          <IconHelp />
          {t.nav.help}
        </NavLink>
        <p className="mt-4 pt-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-content-subtle" role="presentation">
          Administração
        </p>
        {isAdminOrOwner && (
          <NavLink to="/users" className={navLinkClass} onClick={onNavClick('/users', origin)}>
            <IconUsers />
            {t.nav.users}
          </NavLink>
        )}
        {isOwner && (
          <NavLink to="/tenants" className={navLinkClass} onClick={onNavClick('/tenants', origin)}>
            <IconTenants />
            {t.nav.tenants}
          </NavLink>
        )}
        <NavLink to="/subscription" className={navLinkClass} onClick={onNavClick('/subscription', origin)}>
          <IconSubscription />
          {t.nav.subscription}
        </NavLink>
        <NavLink to="/settings/security" className={navLinkClass} onClick={onNavClick('/settings/security', origin)}>
          <IconShield />
          {t.nav.security}
        </NavLink>
        <NavLink to="/settings/notifications" className={navLinkClass} onClick={onNavClick('/settings/notifications', origin)}>
          <IconBell />
          {t.nav.notifications}
        </NavLink>
      </nav>

      {/* User / Logout — mesmo bloco para sidebar e mobile */}
      <div className="shrink-0 border-t border-border-muted p-3">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <Badge variant="primary">{user?.role ? roleLabel(user.role) : '—'}</Badge>
          <div className="flex items-center gap-1.5">
            <Suspense fallback={<span className="block size-10 rounded-button" aria-hidden />}>
              <AlertsBell />
            </Suspense>
            <button
              type="button"
              onClick={() => setLocale(locale === 'pt-BR' ? 'en-US' : 'pt-BR')}
              className="flex min-h-touch min-w-touch items-center justify-center rounded-button text-xs font-semibold text-content-muted hover:bg-surface-muted hover:text-content transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={locale === 'pt-BR' ? 'Mudar para inglês' : 'Switch to Portuguese'}
              title={locale === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
            >
              {locale === 'pt-BR' ? 'EN' : 'PT'}
            </button>
            <ThemeToggle />
          </div>
        </div>
        <p className="truncate px-2 py-1 text-body-sm text-content-subtle" title={user?.email ?? undefined}>
          {user?.email ?? '—'}
        </p>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="mt-2 min-h-touch w-full justify-start gap-2"
          aria-label={t.sidebar.logout}
        >
          <IconLogout className="size-5 shrink-0" aria-hidden />
          {t.sidebar.logout}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface-calm">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden lg:flex w-sidebar flex-col border-r border-border bg-surface shadow-card flex-shrink-0"
        aria-label="Barra lateral"
      >
        {renderSidebarContent('sidebar')}
      </aside>

      {/* ── MOBILE OVERLAY SIDEBAR ── */}
      <Dialog
        open={sidebarOpen}
        as="div"
        className="lg:hidden"
        onClose={() => setSidebarOpen(false)}
      >
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 z-40 bg-content/40"
            aria-hidden="true"
          />
        </TransitionChild>
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="-translate-x-full opacity-0"
          enterTo="translate-x-0 opacity-100"
          leave="ease-in duration-150"
          leaveFrom="translate-x-0 opacity-100"
          leaveTo="-translate-x-full opacity-0"
        >
          <DialogPanel
            className="fixed inset-y-0 left-0 z-50 flex w-sidebar max-w-[85vw] flex-col border-r border-border bg-surface shadow-card"
            aria-label="Menu de navegação"
          >
            <button
              type="button"
              className="absolute right-3 top-3.5 flex min-h-touch min-w-[44px] items-center justify-center rounded-button text-content-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => setSidebarOpen(false)}
              aria-label={t.sidebar.closeMenu}
            >
              <IconX className="size-5" />
            </button>
            {renderSidebarContent('mobile')}
          </DialogPanel>
        </TransitionChild>
      </Dialog>

      {/* ── MAIN ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex min-h-touch min-w-touch items-center justify-center rounded-button text-content-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => setSidebarOpen(true)}
              aria-label={t.sidebar.openMenu}
              aria-expanded={sidebarOpen}
            >
              <IconMenu />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-white">
                <IconPulse className="size-8 shrink-0" />
              </span>
              <span className="text-heading-sm font-semibold text-primary">Fit Insight</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Suspense fallback={<span className="block size-10 rounded-button" aria-hidden />}>
              <AlertsBell />
            </Suspense>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto flex flex-col" id="main-content">
          <a href="#main-content" className="skip-link">
            Pular para o conteúdo principal
          </a>
          {showTrialBanner && (
            <div
              role="region"
              aria-label="Período de teste"
              className="flex flex-wrap items-center justify-between gap-3 border-b border-warning bg-warning-subtle px-4 py-3 sm:px-6"
            >
              <p className="text-body-sm text-warning">
                Seu teste grátis termina em {trialDaysLeft} dias. Assine para não perder acesso.
              </p>
              <div className="flex items-center gap-2">
                <Link
                  to="/subscription"
                  className="rounded-button border border-warning bg-warning px-3 py-1.5 text-body-sm font-medium text-content hover:bg-warning/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
                >
                  Ver planos
                </Link>
                <button
                  type="button"
                  onClick={dismissTrialBanner}
                  className="rounded-button p-1.5 text-warning hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
                  aria-label="Fechar aviso"
                >
                  <IconX className="size-5" />
                </button>
              </div>
            </div>
          )}
          {!navBannerDismissed && (
            <div
              role="region"
              aria-label="Aviso sobre o menu"
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border-muted bg-primary-subtle/50 px-4 py-3 sm:px-6"
            >
              <p className="text-body-sm text-content">
                {t.navBanner.title}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  to="/onboarding"
                  className="rounded-button px-3 py-1.5 text-body-sm font-medium text-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {t.navBanner.cta}
                </Link>
                <button
                  type="button"
                  onClick={dismissNavBanner}
                  className="rounded-button px-2 py-1.5 text-body-sm text-content-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={t.navBanner.dismiss}
                >
                  {t.navBanner.dismiss}
                </button>
              </div>
            </div>
          )}
          <div className="mx-auto flex-1 w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {title && (
              <h1 className="mb-6 text-heading font-semibold text-content sm:text-heading-lg">
                {title}
              </h1>
            )}
            {children}
          </div>
          <footer className="border-t border-border bg-surface-muted/30 py-3">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 text-body-sm text-content-muted">
              <Link
                to="/help"
                className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-button"
              >
                Ajuda
              </Link>
              <Link
                to="/terms"
                className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-button"
              >
                {t.sidebar.terms}
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
