import { ArrowRight, BadgeCheck, Clock3, ShieldCheck } from 'lucide-react';
import { getDemoUrl, getSignupUrl } from '../config/app';
import { Button } from './ui/Button';

const HERO_POINTS = [
  'Centralize anamnese, treino, dieta e evolução em um único fluxo.',
  'Reduza o tempo operacional do atendimento sem perder personalização.',
  'Acompanhe aderência e resultado com mais clareza entre consultas.',
];

const HERO_METRICS = [
  { value: '500+', label: 'profissionais ativos' },
  { value: '10k+', label: 'avaliações realizadas' },
  { value: '89%', label: 'aderência média' },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-24 sm:pt-28">
      <div className="absolute inset-0 mesh-gradient-subtle" aria-hidden="true" />
      <div className="absolute inset-0 bg-dot-grid" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="hero-enter hero-enter-1">
            <span className="inline-flex items-center rounded-full border border-primary/15 bg-white/85 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-primary shadow-sm shadow-primary/5 backdrop-blur-sm">
              SaaS para personal trainers e nutricionistas
            </span>
          </div>

          <h1 className="hero-enter hero-enter-2 mt-8 text-[clamp(2.8rem,6vw,5.4rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-dark text-balance">
            Menos planilha.
            <br />
            <span className="text-gradient">Mais controle sobre cada paciente.</span>
          </h1>

          <p className="hero-enter hero-enter-3 mt-6 max-w-2xl text-lg leading-relaxed text-content-muted sm:text-xl">
            A Fit Insight unifica avaliação, prescrição e acompanhamento para você atender com mais velocidade,
            provar evolução com dados e escalar a operação sem depender de papel, WhatsApp e ferramentas soltas.
          </p>

          <div className="hero-enter hero-enter-4 mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href={getSignupUrl()} variant="primary" size="lg" icon>
              Testar 14 dias grátis
            </Button>
            <a
              href={getDemoUrl()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-dark/10 bg-white/80 px-8 py-4 text-body font-semibold text-dark transition-all hover:border-dark/20 hover:bg-white"
            >
              Agendar demo
              <ArrowRight size={16} className="ml-2 shrink-0" aria-hidden />
            </a>
          </div>

          <div className="hero-enter hero-enter-4 mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-content-subtle">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={15} className="text-primary" aria-hidden />
              Configuração inicial em menos de 5 minutos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={15} className="text-primary" aria-hidden />
              Sem cartão no teste
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-primary" aria-hidden />
              Fluxo alinhado à LGPD
            </span>
          </div>

          <div className="hero-enter hero-enter-4 mt-8 grid gap-3 sm:grid-cols-3">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.05)] backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-dark tabular-nums">{metric.value}</div>
                <div className="mt-1 text-sm text-content-muted">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-enter hero-enter-4 relative lg:justify-self-end">
          <div className="rounded-[2rem] border border-border/70 bg-white/86 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Fluxo operacional</p>
                <h2 className="mt-1 text-lg font-semibold text-dark">Do diagnóstico ao acompanhamento</h2>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                Em produção
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { step: '01', title: 'Anamnese adaptativa', text: 'Perguntas inteligentes substituem formulários longos e ajudam a coletar contexto útil.' },
                { step: '02', title: 'Prescrição centralizada', text: 'Treino e dieta ficam ligados ao histórico do paciente, sem retrabalho.' },
                { step: '03', title: 'Acompanhamento contínuo', text: 'Evolução, fotos, aderência e alertas em um único painel.' },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-border/70 bg-slate-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-dark text-sm font-semibold text-white">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-dark">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-content-muted">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">O que substitui</p>
              <ul className="mt-3 space-y-2">
                {HERO_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-content-muted">
                    <BadgeCheck size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
