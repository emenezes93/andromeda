import { useReveal } from '../hooks/useReveal';

const TESTIMONIALS = [
  {
    name: 'Rodrigo Almeida',
    role: 'Personal Trainer',
    company: 'Atendimento online e presencial',
    result: 'Avaliação inicial de 40 para 15 minutos',
    text: 'A anamnese adaptativa mudou a forma como faço avaliações. Em vez de 40 minutos com formulário em papel, agora consigo uma avaliação completa em 15 minutos.',
    initials: 'RA',
    gradient: 'from-primary to-accent',
  },
  {
    name: 'Camila Ferreira',
    role: 'Nutricionista',
    company: 'Consultório particular',
    result: 'Mais consistência no acompanhamento nutricional',
    text: 'O sistema de gamificação fez meus pacientes aderirem muito mais ao plano nutricional. O streak de dias realmente motiva o acompanhamento diário.',
    initials: 'CF',
    gradient: 'from-accent to-primary',
  },
  {
    name: 'Dr. Marcos Oliveira',
    role: 'Diretor de Clínica',
    company: 'Clínica com 4 profissionais',
    result: 'Mais controle para equipe e operação',
    text: 'Gerenciar 4 profissionais e 200 pacientes ficou muito mais simples. O sistema de permissões e auditoria nos deu a segurança que precisávamos.',
    initials: 'MO',
    gradient: 'from-primary to-primary-dark',
  },
];

export function Testimonials() {
  const headerRef = useReveal();

  return (
    <section id="depoimentos" className="section-default">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="reveal max-w-2xl mb-20">
          <span className="label-soft text-primary">Depoimentos</span>
          <h2 className="mt-4 text-display-sm font-bold text-dark">
            Quem usa, <span className="text-gradient-static">mede impacto.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-content-muted">
            O objetivo não é parecer moderno. É operar melhor, ganhar velocidade e acompanhar mais pacientes com qualidade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  index: number;
}) {
  const ref = useReveal(0.1);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index + 1) * 0.1}s` }}
      className="reveal rounded-2xl border border-border p-8 bento-card"
    >
      <div className="label-soft text-primary">{testimonial.result}</div>
      <p className="text-body text-content-muted leading-relaxed">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="mt-8 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-[13px] font-semibold text-white shadow-lg shadow-primary/20`}>
          {testimonial.initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-dark">{testimonial.name}</div>
          <div className="label-soft text-body-sm text-content-subtle">{testimonial.role}</div>
          <div className="text-xs text-content-subtle mt-1">{testimonial.company}</div>
        </div>
      </div>
    </div>
  );
}
