import { useReveal } from '../hooks/useReveal';

const CAPABILITIES = [
  { number: '01', title: 'Avaliação', text: 'Questionários adaptativos que se aprofundam onde mais importa' },
  { number: '02', title: 'Prescrição', text: 'Treinos e dietas prescritos em uma única plataforma' },
  { number: '03', title: 'Monitoramento', text: 'Alertas inteligentes quando um paciente precisa de atenção' },
  { number: '04', title: 'Resultados', text: 'Relatórios e gráficos que comprovam a evolução' },
];

export function ForProfessionals() {
  const headerRef = useReveal();
  const mockupRef = useReveal(0.1);

  return (
    <section id="profissionais" className="section-default bg-dark text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Text */}
          <div>
            <div ref={headerRef} className="reveal">
              <span className="label-soft text-primary">Para o profissional</span>
              <h2 className="mt-4 text-display-sm font-bold">
                <span className="text-white">Otimize sua rotina.</span>
                <br />
                <span className="text-gradient">Fidelize seus alunos.</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-lg">
                Mais tempo para o que importa: acompanhar seus pacientes.
                A plataforma cuida do resto.
              </p>
            </div>

            <div className="mt-14 space-y-0 divide-y divide-white/10">
              {CAPABILITIES.map((cap, i) => (
                <Capability key={cap.number} {...cap} index={i} />
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div ref={mockupRef} className="reveal-clip hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-2.5 w-2.5 rounded-full bg-success shadow-lg shadow-success/40" />
                <span className="label-soft text-white/40">Dashboard ativo</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Ana Silva', tag: 'Avaliação pendente', tagColor: 'bg-warning/20 text-warning-light' },
                  { name: 'Carlos Santos', tag: 'Meta atingida', tagColor: 'bg-success/20 text-success-light' },
                  { name: 'Maria Costa', tag: '3 dias sem treinar', tagColor: 'bg-error/20 text-error-light' },
                  { name: 'Pedro Lima', tag: 'Streak 14 dias', tagColor: 'bg-primary/20 text-primary-light' },
                ].map((patient) => (
                  <div
                    key={patient.name}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-5 py-4 hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-semibold text-white/90">
                        {patient.name[0]}
                      </div>
                      <span className="text-sm font-medium text-white/80">{patient.name}</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${patient.tagColor}`}>
                      {patient.tag}
                    </span>
                  </div>
                ))}
              </div>
              {/* Mini chart with gradient bars */}
              <div className="mt-6 flex items-end gap-1 h-16 px-2">
                {[35, 50, 40, 65, 55, 80, 60, 75, 90, 70, 85, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/50 to-accent/30"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 px-2">
                <span className="label-soft text-white/20">Jan</span>
                <span className="label-soft text-white/20">Dez</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Capability({
  number,
  title,
  text,
  index,
}: {
  number: string;
  title: string;
  text: string;
  index: number;
}) {
  const ref = useReveal(0.1);

  return (
    <div ref={ref} style={{ transitionDelay: `${(index + 1) * 0.1}s` }} className="reveal flex items-start gap-6 py-6">
      <span className="font-mono text-sm text-gradient-static tabular-nums font-semibold">{number}</span>
      <div>
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/50">{text}</p>
      </div>
    </div>
  );
}
