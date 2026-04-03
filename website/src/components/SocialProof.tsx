import { useReveal } from '../hooks/useReveal';

const STATS = [
  { value: '500+', label: 'profissionais ativos', detail: 'personal trainers e nutricionistas usando a plataforma' },
  { value: '10k+', label: 'avaliações realizadas', detail: 'mais contexto coletado sem papel e sem planilha' },
  { value: '89%', label: 'aderência média', detail: 'em pacientes acompanhados com rotina recorrente' },
  { value: '4.8/5', label: 'nota média', detail: 'satisfação reportada por usuários ativos' },
];

export function SocialProof() {
  const ref = useReveal();

  return (
    <section id="resultados" className="section-tight border-b border-border bg-surface-muted">
      <div ref={ref} className="reveal mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="label-soft text-primary">Resultados e confiança</span>
            <h2 className="mt-4 text-display-sm font-bold text-dark">
              O valor precisa aparecer na operação, não só na interface.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-content-muted">
              A Fit Insight precisa economizar tempo, organizar contexto e melhorar acompanhamento.
              Se não fizer isso, vira só mais uma ferramenta no meio do caos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {STATS.map(({ value, label, detail }) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
                <div className="text-3xl font-bold tabular-nums text-dark">{value}</div>
                <div className="mt-1 text-sm font-semibold text-content-muted">{label}</div>
                <p className="mt-2 text-sm leading-relaxed text-content-subtle">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
