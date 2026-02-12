import { Link, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function PageLayout({ children, title }: PageLayoutProps) {
  const user = getStoredUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-lg font-semibold text-primary">
            Anamnese PaaS
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link to="/templates" className="text-sm text-slate-600 hover:text-slate-900">
              Templates
            </Link>
            <Link to="/sessions" className="text-sm text-slate-600 hover:text-slate-900">
              Sessões
            </Link>
            <span className="text-sm text-slate-500">{user?.email}</span>
            <Button variant="ghost" onClick={handleLogout}>
              Sair
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {title && (
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">{title}</h1>
        )}
        {children}
      </main>
    </div>
  );
}
