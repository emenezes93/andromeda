import { useState, useEffect } from 'react';
import {
  get2faStatus,
  start2faSetup,
  verify2faSetup,
  disable2fa,
} from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type Step = 'idle' | 'qr' | 'verify' | 'disable';

export function SecurityPage() {
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyToken, setVerifyToken] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    get2faStatus()
      .then((res) => {
        setEnabled(res.enabled);
        setStep('idle');
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleStartSetup = () => {
    setLoading(true);
    start2faSetup()
      .then((res) => {
        setQrCodeUrl(res.qrCodeUrl);
        setBackupCodes(res.backupCodes);
        setStep('qr');
        toast.success('Escaneie o QR code no app de autenticação.');
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Erro ao iniciar configuração.');
      })
      .finally(() => setLoading(false));
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = verifyToken.trim().replace(/\s/g, '');
    if (token.length !== 6) {
      toast.error('Digite o código de 6 dígitos.');
      return;
    }
    setVerifySubmitting(true);
    try {
      await verify2faSetup(token);
      toast.success('Autenticação em duas etapas ativada.');
      setStep('idle');
      setVerifyToken('');
      loadStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Código inválido ou expirado.');
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleDisableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword.trim()) {
      toast.error('Digite sua senha.');
      return;
    }
    setDisableSubmitting(true);
    try {
      await disable2fa(disablePassword.trim());
      toast.success('Autenticação em duas etapas desativada.');
      setShowDisableForm(false);
      setDisablePassword('');
      loadStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Senha incorreta.');
    } finally {
      setDisableSubmitting(false);
    }
  };

  if (loading && enabled === null) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-heading font-semibold text-content">Segurança</h2>

      <Card title="Autenticação em duas etapas (2FA)" padding="md">
        <p className="text-body-sm text-content-muted mb-4">
          Adicione uma camada extra de segurança ao fazer login com um código do seu celular ou
          códigos de recuperação.
        </p>

        {step === 'idle' && (
          <div className="flex flex-wrap items-center gap-3">
            {enabled ? (
              <>
                <span className="rounded-button bg-success-subtle px-2.5 py-1 text-body-sm font-medium text-success">
                  Ativado
                </span>
                {!showDisableForm ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDisableForm(true)}
                  >
                    Desativar 2FA
                  </Button>
                ) : (
                  <form onSubmit={handleDisableSubmit} className="flex flex-wrap items-end gap-3">
                    <Input
                      label="Sua senha"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Senha"
                      autoComplete="current-password"
                      className="min-w-[180px]"
                    />
                    <Button type="submit" variant="secondary" size="sm" loading={disableSubmitting} className="bg-error/10 text-error hover:bg-error/20">
                      Confirmar desativação
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDisableForm(false);
                        setDisablePassword('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <Button type="button" size="sm" onClick={handleStartSetup} loading={loading}>
                Ativar 2FA
              </Button>
            )}
          </div>
        )}

        {step === 'qr' && (
          <div className="space-y-4">
            <p className="text-body-sm text-content-muted">
              Escaneie o QR code abaixo com um app de autenticação (Google Authenticator, Authy,
              etc.).
            </p>
            <div className="flex justify-center rounded-lg border border-border bg-surface-muted p-4">
              <img src={qrCodeUrl} alt="QR code para 2FA" className="h-48 w-48" />
            </div>
            {backupCodes.length > 0 && (
              <div>
                <p className="text-body-sm font-medium text-content mb-2">
                  Códigos de recuperação (guarde em local seguro):
                </p>
                <ul className="rounded-button bg-surface-muted px-3 py-2 font-mono text-body-sm text-content">
                  {backupCodes.map((code, i) => (
                    <li key={i}>{code}</li>
                  ))}
                </ul>
              </div>
            )}
            <form onSubmit={handleVerify} className="flex flex-wrap items-end gap-3">
              <Input
                label="Código de 6 dígitos"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                className="w-32"
              />
              <Button type="submit" size="sm" loading={verifySubmitting}>
                Verificar e ativar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep('idle');
                  setVerifyToken('');
                  loadStatus();
                }}
              >
                Cancelar
              </Button>
            </form>
          </div>
        )}
      </Card>

    </div>
  );
}
