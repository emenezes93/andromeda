import { useReveal } from '../hooks/useReveal';

const PAIN_BULLETS = [
  'Formulários longos em papel ou planilhas que consomem tempo do atendimento.',
  'Dados dispersos: anamnese, treino e dieta em lugares diferentes, sem visão única do paciente.',
  'Dificuldade para acompanhar a evolução e comprovar resultados.',
];

export function PainSection() {
  const ref = useReveal(0.15);

  return (
    <section className="section-tight bg-surface-muted border-b border-border" aria-labelledby="pain-heading">
      <div ref={ref} className="reveal mx-auto max-w-3xl px-6 lg:px-8 text-center">
        <h2 id="pain-heading" className="text-heading font-bold text-dark mb-2">
          Você já passou por isso?
        </h2>
        <ul className="mt-4 space-y-2 text-body text-content-muted text-left list-disc list-inside">
          {PAIN_BULLETS.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <p className="mt-6 text-body text-dark font-medium">
          O Fit Insight reúne avaliação, prescrição e acompanhamento em um só lugar.
        </p>
      </div>
    </section>
  );
}
