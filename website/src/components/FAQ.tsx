import { useReveal } from '../hooks/useReveal';

const ITEMS = [
  {
    pergunta: 'Preciso de cartão de crédito para testar?',
    resposta: 'Não. O teste de 14 dias é grátis e não exige cartão. Você só informa dados de pagamento se decidir assinar após o período.',
  },
  {
    pergunta: 'Meus dados e dos pacientes estão seguros?',
    resposta: 'Sim. Tratamos os dados conforme a LGPD e boas práticas de segurança. Dados de saúde ficam sob seu controle e da sua organização.',
  },
  {
    pergunta: 'Funciona no celular?',
    resposta: 'Sim. A plataforma é responsiva e o portal do paciente pode ser acessado pelo celular para registrar treinos, dieta e evolução.',
  },
  {
    pergunta: 'Quanto tempo leva para configurar?',
    resposta: 'Em menos de 5 minutos você cria sua conta e pode começar a usar templates de questionário. A configuração completa depende do que você quiser personalizar.',
  },
  {
    pergunta: 'Posso cancelar quando quiser?',
    resposta: 'Sim. Não há fidelidade. Você pode cancelar a qualquer momento pelo painel, sem multa.',
  },
];

export function FAQ() {
  const ref = useReveal(0.1);

  return (
    <section id="faq" className="section-default bg-white">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div ref={ref} className="reveal text-center mb-14">
          <span className="label-soft text-primary">Perguntas frequentes</span>
          <h2 className="mt-4 text-display-sm font-bold text-dark">
            Dúvidas antes de <span className="text-gradient-static">começar?</span>
          </h2>
        </div>

        <dl className="space-y-8">
          {ITEMS.map((item) => (
            <div key={item.pergunta} className="border-b border-border pb-8 last:border-0 last:pb-0">
              <dt className="text-body font-semibold text-dark">{item.pergunta}</dt>
              <dd className="mt-2 text-body text-content-muted leading-relaxed">{item.resposta}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
