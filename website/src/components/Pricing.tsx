import { Check } from 'lucide-react';
import { useReveal } from '../hooks/useReveal';
import { getSignupUrl, getContactUrl } from '../config/app';
import { Button } from './ui/Button';

interface Plan {
  name: string;
  price: string;
  period: string;
  audience: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    audience: 'Validação inicial',
    description: 'Para conhecer a plataforma',
    features: [
      'Até 3 pacientes',
      '10 avaliações/mês',
      'Templates de questionário',
      'Evolução básica',
    ],
    cta: 'Criar conta grátis',
  },
  {
    name: 'Pro',
    price: 'R$ 49',
    period: '/mês',
    audience: 'Atendimento solo',
    description: 'Para você que atende sozinho',
    features: [
      'Até 50 pacientes',
      'Avaliações ilimitadas',
      'Insights com IA',
      'Treino + dieta + gamificação',
      'Fotos e agendamentos',
    ],
    cta: 'Assinar Pro',
    featured: true,
  },
  {
    name: 'Clínica',
    price: 'R$ 149',
    period: '/mês',
    audience: 'Operação em equipe',
    description: 'Para sua clínica ou consultório',
    features: [
      'Até 300 pacientes',
      'Tudo do Pro',
      'Equipe com permissões',
      'Branding personalizado',
      'Portal do paciente',
      'Auditoria completa',
    ],
    cta: 'Assinar Clínica',
  },
  {
    name: 'Escala',
    price: 'R$ 299',
    period: '/mês',
    audience: 'Multiunidade e rede',
    description: 'Para redes e franquias',
    features: [
      'Pacientes ilimitados',
      'Tudo do Clínica',
      'Multi-tenant avançado',
      'IA com modelo customizado',
      'SLA e suporte dedicado',
    ],
    cta: 'Falar com vendas',
  },
];

export function Pricing() {
  const headerRef = useReveal();

  return (
    <section id="planos" className="section-default bg-surface-muted">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="reveal text-center max-w-2xl mx-auto mb-20">
          <span className="label-soft text-primary">Planos</span>
          <h2 className="mt-4 text-display-sm font-bold text-dark">
            Simples e <span className="text-gradient-static">transparente</span>
          </h2>
          <p className="mt-4 text-lg text-content-muted">
            Escolha conforme o estágio da sua operação. O critério não deve ser preço isolado,
            e sim quanto tempo e controle você recupera em cada atendimento.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const ref = useReveal(0.1);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index + 1) * 0.1}s` }}
      className={`reveal flex flex-col rounded-2xl p-7 bento-card ${
        plan.featured
          ? 'bg-gradient-to-br from-dark to-dark-muted text-white ring-1 ring-white/10'
          : 'bg-white border border-border'
      }`}
    >
      {plan.featured && (
        <span className="label-soft text-gradient-static mb-4">Mais popular</span>
      )}
      <span className={`label-soft ${plan.featured ? 'text-white/60' : 'text-primary'} mb-3`}>
        {plan.audience}
      </span>
      <h3 className={`text-lg font-semibold ${plan.featured ? 'text-white' : 'text-dark'}`}>
        {plan.name}
      </h3>
      <p className={`mt-1 text-body-sm ${plan.featured ? 'text-white/50' : 'text-content-subtle'}`}>
        {plan.description}
      </p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className={`text-3xl font-bold tabular-nums ${plan.featured ? 'text-white' : 'text-dark'}`}>
          {plan.price}
        </span>
        <span className={`text-sm ${plan.featured ? 'text-white/40' : 'text-content-subtle'}`}>
          {plan.period}
        </span>
      </div>

      <ul className="mt-7 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              size={14}
              className={`shrink-0 mt-0.5 ${plan.featured ? 'text-primary' : 'text-primary'}`}
              strokeWidth={2.5}
            />
            <span className={`text-body-sm ${plan.featured ? 'text-white/70' : 'text-content-muted'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Button
          href={plan.cta === 'Falar com vendas' ? getContactUrl() : getSignupUrl()}
          variant={plan.featured ? 'primary' : 'secondary'}
          size="md"
          icon
          className={`mt-7 ${plan.featured ? 'bg-gradient-to-r from-primary to-accent' : ''}`}
        >
          {plan.cta}
        </Button>
    </div>
  );
}
