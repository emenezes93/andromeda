import { IconPulse } from './IconPulse';
import { getContactUrl, getDemoUrl, getLoginUrl, getSignupUrl } from '../config/app';

const LINKS = {
  Plataforma: [
    { label: 'Como funciona', href: '#como-funciona' },
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Planos', href: '#planos' },
    { label: 'FAQ', href: '#faq' },
  ],
  Conversa: [
    { label: 'Agendar demo', href: getDemoUrl() },
    { label: 'Criar conta', href: getSignupUrl() },
    { label: 'Entrar', href: getLoginUrl() },
    { label: 'Contato comercial', href: getContactUrl() },
  ],
} as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <IconPulse size={32} className="shrink-0" />
              <span className="text-lg font-bold tracking-tight text-white">
                Fit Insight
              </span>
            </div>
            <p className="mt-4 max-w-sm text-body-sm leading-relaxed text-white/65">
              Software para personal trainers, nutricionistas e operações de saúde e performance que precisam
              organizar avaliação, prescrição e acompanhamento em um único sistema.
            </p>

            <div className="mt-6 space-y-2 text-sm text-white/55">
              <p>Contato: <a href="mailto:contato@fitinsight.com.br" className="text-white/80 hover:text-white">contato@fitinsight.com.br</a></p>
              <p>Suporte comercial por e-mail e demonstração agendada.</p>
              <p>Tratamento de dados com foco em boas práticas e alinhamento à LGPD.</p>
            </div>
          </div>

          {Object.entries(LINKS).map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <h4 className="label-soft text-white/45">{title}</h4>
              <ul className="mt-5 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-body-sm text-white/65 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h4 className="label-soft text-white/45">Confiança</h4>
            <ul className="mt-5 space-y-3 text-body-sm text-white/65">
              <li>Sem cartão no período de teste.</li>
              <li>Onboarding inicial rápido para profissionais autônomos e equipes.</li>
              <li>Fluxo pensado para reduzir retrabalho e centralizar histórico do paciente.</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-white/45">
            &copy; {year} Fit Insight. Todos os direitos reservados.
          </p>
          <p className="text-caption text-white/35">
            Landing focada em avaliação, prescrição e acompanhamento para profissionais de saúde e performance.
          </p>
        </div>
      </div>
    </footer>
  );
}
