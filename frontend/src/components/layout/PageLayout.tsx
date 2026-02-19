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

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: IconDashboard },
  { to: '/templates', label: 'Templates', icon: IconTemplates },
  { to: '/sessions', label: 'Sessões', icon: IconSessions },
  { to: '/patients', label: 'Pacientes', icon: IconPatients },
  { to: '/audit', label: 'Auditoria', icon: IconAudit },
];

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    practitioner: 'Praticante',
    viewer: 'Visualizador',
  };
  return labels[role] ?? role;
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
            Usuários
          </NavLink>
        )}
        {isOwner && (
          <NavLink to="/tenants" className={navLinkClass}>
            <IconTenants />
            Tenants
          </NavLink>
        )}
        <NavLink to="/subscription" className={navLinkClass}>
          <IconSubscription />
          Assinatura
        </NavLink>
      </nav>

      {/* User / Logout */}
      <div className="border-t border-border-muted p-3">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Badge variant="primary">{user?.role ? roleLabel(user.role) : '—'}</Badge>
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
          Sair
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
          aria-label="Fechar menu"
        >
          <IconX />
        </button>
        {sidebarContent}
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
          <button
            className="flex min-h-touch min-w-[40px] items-center justify-center rounded-button text-content-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={sidebarOpen}
          >
            <IconMenu />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <IconPulse />
            <span className="text-heading-sm font-semibold text-primary">Anamnese PaaS</span>
          </Link>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {title && (
              <h1 className="mb-6 text-heading font-semibold text-content sm:text-heading-lg">
                {title}
              </h1>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
