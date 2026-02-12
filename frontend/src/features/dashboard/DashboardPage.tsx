import { Link } from 'react-router-dom';
import { getStoredUser } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';

export function DashboardPage() {
  const user = getStoredUser();

  const links = [
    { to: '/templates', label: 'Templates de anamnese', desc: 'Criar e listar questionários' },
    { to: '/sessions', label: 'Sessões', desc: 'Iniciar e acompanhar sessões' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-slate-600">
          Olá, <span className="font-medium text-slate-900">{user?.name || user?.email}</span>.
          Tenant: <span className="font-mono text-sm">{user?.tenantId}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map(({ to, label, desc }) => (
          <Link key={to} to={to}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <h2 className="font-semibold text-slate-900">{label}</h2>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
