import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '@/api/auth';
import { identifyUser, track } from '@/lib/analytics';
import { setAuth } from '@/stores/authStore';
import { isOnboardingDismissed } from '@/stores/onboardingStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { IconPulse } from '@/components/icons';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  tenantName: z
    .string()
    .min(2, 'Nome do studio/equipe deve ter no mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', tenantName: '' },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res = await signup({
        email: data.email,
        password: data.password,
        name: data.name,
        tenantName: data.tenantName,
      });
      setAuth(res.token, res.refreshToken, res.user);
      identifyUser(res.user.id, { email: res.user.email, role: res.user.role, tenantId: res.user.tenantId });
      track({ name: 'signup_complete', tenantId: res.user.tenantId });
      navigate(isOnboardingDismissed() ? '/' : '/onboarding', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-calm px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div
        className="login-bg-blob pointer-events-none absolute -left-1/4 top-1/4 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl motion-reduce:animate-none"
        aria-hidden
      />
      <div
        className="login-bg-blob pointer-events-none absolute -right-1/4 bottom-1/4 h-[360px] w-[360px] rounded-full bg-primary/15 blur-3xl motion-reduce:animate-none"
        aria-hidden
        style={{ animationDelay: '-4s' }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="login-enter mb-8 flex flex-col items-center gap-4">
          <span className="text-white" aria-hidden>
            <IconPulse
              className="login-logo-pulse size-14 motion-reduce:animate-none"
              aria-hidden
            />
          </span>
          <div className="text-center">
            <h1 className="text-display font-bold text-content">Fit Insight</h1>
            <p className="mt-1 text-body text-content-muted">Criar conta</p>
          </div>
        </div>

        <div className="login-enter login-enter-stagger-1 rounded-2xl border border-border-muted bg-surface/95 p-6 shadow-soft backdrop-blur-sm">
          <p className="mb-4 rounded-button border border-primary/30 bg-primary-subtle px-3 py-2.5 text-body-sm text-primary">
            14 dias grátis, sem cartão de crédito
          </p>
          <h2 className="text-heading-sm font-semibold text-content">Criar conta</h2>
          <p className="mt-0.5 text-body-sm text-content-muted">
            Nome completo, e-mail, senha e o nome do seu studio, equipe ou marca profissional.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="login-enter login-enter-stagger-2">
              <Input
                label="Nome completo"
                type="text"
                autoComplete="name"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div className="login-enter login-enter-stagger-2">
              <Input
                label="E-mail"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="login-enter login-enter-stagger-3">
              <Input
                label="Senha"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            <div className="login-enter login-enter-stagger-3">
              <Input
                label="Nome do studio/equipe"
                type="text"
                autoComplete="organization"
                error={errors.tenantName?.message}
                {...register('tenantName')}
              />
            </div>

            {apiError && (
              <div
                className="rounded-button bg-error-light px-3 py-2.5 text-body-sm text-error transition-opacity"
                role="alert"
              >
                {apiError}
              </div>
            )}

            <div className="pt-1">
              <Button
                type="submit"
                className="w-full transition-calm hover:scale-[1.01] active:scale-[0.99]"
                size="lg"
                loading={isSubmitting}
              >
                Criar conta
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-body-sm text-content-subtle">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
