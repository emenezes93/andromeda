import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth';
import { setAuth } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconPulse } from '@/components/icons';

const schema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res = await login(data.email, data.password);
      setAuth(res.token, res.refreshToken, res.user);
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-calm px-4 py-8">
      {/* Background: blob suave e animado (respeita prefers-reduced-motion via .login-bg-blob) */}
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
        {/* Identidade: logo com pulse suave + título */}
        <div className="login-enter mb-8 flex flex-col items-center gap-4">
          <IconPulse
            className="login-logo-pulse size-14 motion-reduce:animate-none"
            aria-hidden
          />
          <div className="text-center">
            <h1 className="text-display font-bold text-content">Anamnese Inteligente</h1>
            <p className="mt-1 text-body text-content-muted">
              Questionários adaptativos e insights em saúde
            </p>
          </div>
        </div>

        {/* Card do formulário: entrada com leve atraso */}
        <div
          className="login-enter login-enter-stagger-1 rounded-2xl border border-border-muted bg-surface/95 p-6 shadow-soft backdrop-blur-sm"
          style={{ boxShadow: '0 2px 12px rgb(14 165 233 / 0.06)' }}
        >
          <h2 className="text-heading-sm font-semibold text-content">Entrar</h2>
          <p className="mt-0.5 text-body-sm text-content-muted">
            E-mail e senha para acessar.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
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
                Entrar
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-body-sm text-content-subtle">
            Demo: owner@demo.com / owner123
          </p>
        </div>
      </div>
    </div>
  );
}
