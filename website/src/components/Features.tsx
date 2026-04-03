import {
  ClipboardCheck,
  Brain,
  Dumbbell,
  Apple,
  Target,
  BarChart3,
  Camera,
  CalendarClock,
  type LucideIcon,
} from 'lucide-react';
import { useReveal } from '../hooks/useReveal';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  span?: 'lg';
  gradient?: string;
}

const FEATURES: Feature[] = [
  {
    icon: ClipboardCheck,
    title: 'Anamnese adaptativa',
    description:
      'Questionários com lógica condicional que se adaptam conforme as respostas. As perguntas certas, no momento certo — sem formulários genéricos.',
    span: 'lg',
    gradient: 'from-primary/8 to-accent/4',
  },
  {
    icon: Brain,
    title: 'Insights com IA',
    description:
      'Análise automática identifica riscos, nível de prontidão e gera recomendações personalizadas para cada paciente.',
    span: 'lg',
    gradient: 'from-accent/8 to-primary/4',
  },
  {
    icon: Dumbbell,
    title: 'Planos de treino',
    description: 'Prescreva treinos completos com biblioteca de exercícios e acompanhe execução e aderência.',
  },
  {
    icon: Apple,
    title: 'Planos de dieta',
    description: 'Prescrição nutricional com metas de macros e gamificação que motiva.',
  },
  {
    icon: Target,
    title: 'Metas e objetivos',
    description: 'Metas mensuráveis com progresso automático baseado nos dados de evolução.',
  },
  {
    icon: BarChart3,
    title: 'Evolução visual',
    description: 'Gráficos de peso, medidas e composição corporal ao longo do tempo.',
    span: 'lg',
    gradient: 'from-primary/6 to-accent/6',
  },
  {
    icon: Camera,
    title: 'Fotos de progresso',
    description: 'Registro fotográfico datado para comparar evolução visual.',
  },
  {
    icon: CalendarClock,
    title: 'Agendamentos',
    description: 'Questionários recorrentes automáticos — semanal, quinzenal ou mensal.',
  },
];

export function Features() {
  const headerRef = useReveal();

  return (
    <section id="funcionalidades" className="section-default">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="reveal max-w-2xl mb-16">
          <span className="label-soft text-primary">Plataforma</span>
          <h2 className="mt-4 text-display-sm font-bold text-dark">
            Tudo em um <span className="text-gradient-static">só lugar</span>
          </h2>
          <p className="mt-4 text-lg text-content-muted leading-relaxed">
            Da avaliação inicial ao acompanhamento diário, com inteligência artificial
            para potencializar seus resultados.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <BentoCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BentoCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useReveal(0.08);
  const { icon: Icon, title, description, span, gradient } = feature;
  const isLarge = span === 'lg';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(Math.min(index % 3, 3) + 1) * 0.1}s` }}
      className={`reveal bento-card rounded-2xl border border-border p-8 ${
        isLarge ? 'sm:col-span-2 lg:col-span-1' : ''
      } ${gradient ? `bg-gradient-to-br ${gradient}` : 'bg-white'} group`}
    >
      <div className="bento-card-icon flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent text-white shrink-0">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 className={`mt-5 font-semibold text-dark ${isLarge ? 'text-lg' : 'text-body'}`}>
        {title}
      </h3>
      <p className={`mt-2 text-content-muted leading-relaxed ${isLarge ? 'text-body' : 'text-body-sm'}`}>
        {description}
      </p>
    </div>
  );
}
