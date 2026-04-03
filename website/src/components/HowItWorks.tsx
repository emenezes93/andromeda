import { Brain, ClipboardList, LineChart, Sparkles } from 'lucide-react';
import { useReveal } from '../hooks/useReveal';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Capture contexto sem fricção',
    text: 'Anamneses adaptativas organizam dados clínicos, objetivos e restrições sem depender de papel ou planilha.',
  },
  {
    icon: Brain,
    title: 'Transforme respostas em decisão',
    text: 'A plataforma consolida histórico, destaca riscos e ajuda o profissional a prescrever com mais velocidade.',
  },
  {
    icon: LineChart,
    title: 'Acompanhe aderência e evolução',
    text: 'Treino, dieta, fotos e progresso ficam conectados para reduzir abandono e provar resultado.',
  },
];

const DIFFERENCES = [
  'Sem alternar entre WhatsApp, formulário, treino e dieta em ferramentas separadas.',
  'Mais contexto por paciente, menos retrabalho para montar e atualizar prescrição.',
  'Melhor visibilidade de aderência para atuar antes que o paciente abandone o plano.',
];

export function HowItWorks() {
  const headerRef = useReveal();
  const compareRef = useReveal(0.1);

  return (
    <section id="como-funciona" className="section-default border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="reveal mx-auto max-w-3xl text-center">
          <span className="label-soft text-primary">Como funciona</span>
          <h2 className="mt-4 text-display-sm font-bold text-dark">
            Um fluxo único para <span className="text-gradient-static">avaliar, prescrever e acompanhar</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-content-muted">
            O objetivo não é adicionar mais uma ferramenta ao seu processo. É substituir a bagunça operacional
            por um sistema que organiza o atendimento do início ao resultado.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <StepCard key={step.title} {...step} index={index} />
          ))}
        </div>

        <div
          ref={compareRef}
          className="reveal mt-12 grid gap-6 rounded-[2rem] border border-border bg-surface-muted p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] lg:grid-cols-[0.85fr_1.15fr] lg:p-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <Sparkles size={14} aria-hidden />
              Antes vs depois
            </div>
            <h3 className="mt-4 text-2xl font-bold text-dark">
              A Fit Insight precisa ganhar da sua operação atual. Se não ganhar, não serve.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-content-muted">
              O concorrente real não é outro software. É o fluxo atual feito de papel, conversa solta,
              memória do profissional e ferramentas desconectadas.
            </p>
          </div>

          <ul className="space-y-3">
            {DIFFERENCES.map((item) => (
              <li key={item} className="rounded-2xl border border-border bg-white p-4 text-sm leading-relaxed text-content-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  icon: Icon,
  title,
  text,
  index,
}: {
  icon: typeof ClipboardList;
  title: string;
  text: string;
  index: number;
}) {
  const ref = useReveal(0.08);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index + 1) * 0.08}s` }}
      className="reveal rounded-[1.75rem] border border-border bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-dark">{title}</h3>
      <p className="mt-2 text-body leading-relaxed text-content-muted">{text}</p>
    </div>
  );
}
