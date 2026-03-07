import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login, login2fa } from '@/api/auth';
import { identifyUser } from '@/lib/analytics';
import { setAuth } from '@/stores/authStore';
import { isOnboardingDismissed } from '@/stores/onboardingStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { IconPulse } from '@/components/icons';

const schema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';
  const [apiError, setApiError] = useState<string | null>(null);
  useEffect(() => {
    if (sessionExpired) {
      setSearchParams((p) => {
        p.delete('reason');
        return p;
      }, { replace: true });
    }
  }, [sessionExpired, setSearchParams]);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

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
      if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
        setTwoFactorEmail(data.email);
        setTwoFactorPassword(data.password);
        setTwoFactorStep(true);
        return;
      }
      const authRes = res as { token: string; refreshToken: string; user: { id: string; email: string; name: string | null; role: string; tenantId: string } };
      setAuth(authRes.token, authRes.refreshToken, authRes.user);
      identifyUser(authRes.user.id, { email: authRes.user.email, role: authRes.user.role, tenantId: authRes.user.tenantId });
      navigate(isOnboardingDismissed() ? '/' : '/onboarding', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  const onTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const code = twoFactorCode.trim().replace(/\s/g, '');
    if (!code) {
      setApiError('Digite o código do app ou um código de recuperação.');
      return;
    }
    setTwoFactorSubmitting(true);
    try {
      const isBackup = code.length === 8 && /^\d+$/.test(code);
      const res = await login2fa(
        twoFactorEmail,
        twoFactorPassword,
        isBackup ? undefined : code,
        isBackup ? code : undefined
      );
      setAuth(res.token, res.refreshToken, res.user);
      identifyUser(res.user.id, { email: res.user.email, role: res.user.role, tenantId: res.user.tenantId });
      navigate(isOnboardingDismissed() ? '/' : '/onboarding', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Código inválido ou expirado.');
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-calm px-4 py-8">
      {/* Theme Toggle - top right */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
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
          <span className="text-white" aria-hidden>
            <IconPulse
              className="login-logo-pulse size-14 motion-reduce:animate-none"
              aria-hidden
            />
          </span>
          <div className="text-center">
            <h1 className="text-display font-bold text-content">Fit Insight</h1>
            <p className="mt-1 text-body text-content-muted">
              Questionários adaptativos e insights em saúde
            </p>
          </div>
        </div>

        {/* Card do formulário: entrada com leve atraso */}
        <div className="login-enter login-enter-stagger-1 rounded-2xl border border-border-muted bg-surface/95 p-6 shadow-soft backdrop-blur-sm">
          {sessionExpired && (
            <div
              className="mb-4 rounded-button border border-warning bg-warning-subtle px-3 py-2.5 text-body-sm text-warning"
              role="alert"
            >
              Sua sessão expirou. Faça login novamente para continuar.
            </div>
          )}
          <h2 className="text-heading-sm font-semibold text-content">
            {twoFactorStep ? 'Código de autenticação' : 'Entrar'}
          </h2>
          <p className="mt-0.5 text-body-sm text-content-muted">
            {twoFactorStep
              ? 'Digite o código de 6 dígitos do app ou um código de recuperação de 8 dígitos.'
              : 'E-mail e senha para acessar.'}
          </p>

          {!twoFactorStep ? (
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
          ) : (
            <form onSubmit={onTwoFactorSubmit} className="mt-6 space-y-4">
              <p className="text-body-sm text-content-muted">{twoFactorEmail}</p>
              <Input
                label="Código"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000 ou código de recuperação"
                value={twoFactorCode}
                onChange={(e) =>
                  setTwoFactorCode(e.target.value.replace(/\s/g, '').slice(0, 8))
                }
                maxLength={8}
              />

              {apiError && (
                <div
                  className="rounded-button bg-error-light px-3 py-2.5 text-body-sm text-error transition-opacity"
                  role="alert"
                >
                  {apiError}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="submit"
                  className="w-full transition-calm hover:scale-[1.01] active:scale-[0.99]"
                  size="lg"
                  loading={twoFactorSubmitting}
                >
                  Verificar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTwoFactorStep(false);
                    setTwoFactorCode('');
                    setApiError(null);
                  }}
                >
                  Voltar ao login
                </Button>
              </div>
            </form>
          )}

          {!twoFactorStep && (
            <p className="mt-4 text-center text-body-sm text-content-subtle">
              Não tem conta?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Criar conta grátis
              </Link>
            </p>
          )}
          {!twoFactorStep && (
            <p className="mt-1 text-center text-body-sm text-content-subtle">
              Demo: owner@demo.com / owner123
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
