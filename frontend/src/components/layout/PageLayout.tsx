import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { clearAuth, getStoredUser } from '@/stores/authStore';
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
} from '@/components/icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';

function IconAi() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconSchedule() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  );
}

function IconTraining() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 6.5h11" />
      <path d="M6.5 17.5h11" />
      <path d="M3 10v4" />
      <path d="M21 10v4" />
      <path d="M5 8v8" />
      <path d="M19 8v8" />
    </svg>
  );
}

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function IconMenu() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function IconX() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-touch flex items-center gap-3 rounded-button px-3 py-2.5 text-body-sm font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
    isActive
      ? 'bg-primary-subtle text-primary'
      : 'text-content-muted hover:bg-primary-subtle hover:text-content'
  }`;

export function PageLayout({ children, title }: PageLayoutProps) {
  const user = getStoredUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, locale, setLocale } = useTranslation();

  // Fecha sidebar ao navegar em mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';
  const isOwner = user?.role === 'owner';

  const navItems = [
    { to: '/', label: t.nav.dashboard, icon: IconDashboard },
    { to: '/templates', label: t.nav.templates, icon: IconTemplates },
    { to: '/sessions', label: t.nav.sessions, icon: IconSessions },
    { to: '/patients', label: t.nav.patients, icon: IconPatients },
    { to: '/training-plans', label: t.nav.trainingPlans, icon: IconTraining },
    { to: '/scheduled-questionnaires', label: t.nav.scheduledQuestionnaires, icon: IconSchedule },
    { to: '/audit', label: t.nav.audit, icon: IconAudit },
    { to: '/ai/usage', label: t.nav.aiUsage, icon: IconAi },
  ];

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: t.roles.owner,
      admin: t.roles.admin,
      practitioner: t.roles.practitioner,
      viewer: t.roles.viewer,
    };
    return labels[role] ?? role;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border-muted px-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-button transition-calm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <IconPulse />
          <span className="text-heading-sm font-semibold text-primary">Anamnese PaaS</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Navegação principal">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={navLinkClass}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
        {isAdminOrOwner && (
          <NavLink to="/users" className={navLinkClass}>
            <IconUsers />
            {t.nav.users}
          </NavLink>
        )}
        {isOwner && (
          <NavLink to="/tenants" className={navLinkClass}>
            <IconTenants />
            {t.nav.tenants}
          </NavLink>
        )}
        <NavLink to="/subscription" className={navLinkClass}>
          <IconSubscription />
          {t.nav.subscription}
        </NavLink>
      </nav>

      {/* User / Logout */}
      <div className="border-t border-border-muted p-3">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <Badge variant="primary">{user?.role ? roleLabel(user.role) : '—'}</Badge>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLocale(locale === 'pt-BR' ? 'en-US' : 'pt-BR')}
              className="rounded-button px-1.5 py-0.5 text-xs font-semibold text-content-muted hover:bg-surface-muted hover:text-content transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Alternar idioma"
              title={locale === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
            >
              {locale === 'pt-BR' ? 'EN' : 'PT'}
            </button>
            <ThemeToggle />
          </div>
        </div>
        <p className="truncate px-2 py-1 text-body-sm text-content-subtle" title={user?.email}>
          {user?.email}
        </p>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="mt-1 w-full justify-start gap-2"
        >
          <IconLogout />
          {t.sidebar.logout}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface-calm">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-sidebar flex-col border-r border-border bg-surface shadow-card flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* ── MOBILE OVERLAY SIDEBAR ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-content/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col border-r border-border bg-surface shadow-card transition-transform duration-normal ease-calm lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar mobile"
      >
        {/* Close button inside mobile sidebar */}
        <button
          className="absolute right-3 top-3.5 flex min-h-[32px] min-w-[32px] items-center justify-center rounded-button text-content-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setSidebarOpen(false)}
          aria-label={t.sidebar.closeMenu}
        >
          <IconX />
        </button>
        {sidebarContent}
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              className="flex min-h-touch min-w-[40px] items-center justify-center rounded-button text-content-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setSidebarOpen(true)}
              aria-label={t.sidebar.openMenu}
              aria-expanded={sidebarOpen}
            >
              <IconMenu />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <IconPulse />
              <span className="text-heading-sm font-semibold text-primary">Anamnese PaaS</span>
            </Link>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto flex flex-col">
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
