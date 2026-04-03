import { useReveal } from '../hooks/useReveal';
import { getDemoUrl, getSignupUrl } from '../config/app';
import { Button } from './ui/Button';

export function CTASection() {
  const ref = useReveal(0.2);

  return (
    <section className="relative section-default overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" aria-hidden="true" />

      {/* Noise overlay for texture */}
      <div className="absolute inset-0 bg-noise" aria-hidden="true" />

      <div ref={ref} className="reveal relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-display-sm sm:text-[3.5rem] font-bold text-white text-balance leading-[1.1]">
          Pare de operar no improviso.
          <br className="hidden sm:block" />
          Estruture sua rotina com dados.
        </h2>
        <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto">
          Se a sua rotina ainda depende de papel, conversa solta e ferramentas desconectadas,
          a Fit Insight já tem espaço para gerar ganho imediato.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button href={getSignupUrl()} variant="white" size="lg" icon>
            Testar 14 dias grátis
          </Button>
          <a
            href={getDemoUrl()}
            className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-8 py-4 text-body font-semibold text-white hover:bg-white/10 hover:border-white/50 transition-all min-h-[48px]"
          >
            Agendar demo
          </a>
        </div>
        <p className="mt-5 text-body-sm text-white/50">
          Sem cartão &middot; Configuração em menos de 5 min &middot; Sem fidelidade
        </p>
      </div>
    </section>
  );
}
