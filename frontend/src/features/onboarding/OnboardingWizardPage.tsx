import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dismissOnboarding } from '@/stores/onboardingStore';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface Step {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Anamnese Inteligente!',
    description:
      'Este assistente vai te guiar nos primeiros passos para configurar sua conta e começar a usar a plataforma.',
    actionLabel: 'Começar',
    actionPath: '',
    icon: (
      <svg className="size-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    id: 'template',
    title: 'Crie seu primeiro template',
    description:
      'Templates são questionários de anamnese que você aplica aos seus pacientes. Crie um agora para começar.',
    actionLabel: 'Criar template',
    actionPath: '/templates/new',
    icon: (
      <svg className="size-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    id: 'patient',
    title: 'Cadastre um paciente',
    description:
      'Adicione seus pacientes para vincular sessões e acompanhar a evolução ao longo do tempo.',
    actionLabel: 'Cadastrar paciente',
    actionPath: '/patients/new',
    icon: (
      <svg className="size-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: 'session',
    title: 'Inicie uma sessão de anamnese',
    description:
      'Vincule um template a um paciente e inicie o questionário adaptativo com insights de IA.',
    actionLabel: 'Iniciar sessão',
    actionPath: '/sessions/new',
    icon: (
      <svg className="size-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    id: 'done',
    title: 'Tudo pronto!',
    description:
      'Você está pronto para usar o Anamnese Inteligente. Explore o dashboard, configure notificações e muito mais.',
    actionLabel: 'Ir para o dashboard',
    actionPath: '/',
    icon: (
      <svg className="size-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function StepProgress({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i <= current ? 'bg-primary' : 'bg-surface-muted'
          }`}
        />
      ))}
    </div>
  );
}

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const handleAction = () => {
    if (isLast) {
      dismissOnboarding();
      navigate('/');
      return;
    }
    if (step.actionPath) {
      navigate(step.actionPath);
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleSkipStep = () => {
    if (isLast) {
      dismissOnboarding();
      navigate('/');
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleSkipAll = () => {
    dismissOnboarding();
    navigate('/');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-calm px-4 py-8">
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={handleSkipAll}
          className="text-body-sm text-content-subtle hover:text-content transition-calm"
        >
          Pular tudo
        </button>
      </div>

      <div className="w-full max-w-lg space-y-6">
        <StepProgress total={STEPS.length} current={stepIndex} />

        <div className="rounded-2xl border border-border-muted bg-surface/95 p-8 shadow-soft text-center space-y-6">
          <div className="flex justify-center">{step.icon}</div>

          <div className="space-y-2">
            <h1 className="text-heading font-semibold text-content">{step.title}</h1>
            <p className="text-body text-content-muted leading-relaxed">{step.description}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleAction}
              size="lg"
              className="w-full"
            >
              {step.actionLabel}
            </Button>
            {!isLast && (
              <Button
                onClick={handleSkipStep}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                Fazer depois
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-body-sm text-content-subtle">
          Passo {stepIndex + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  );
}
