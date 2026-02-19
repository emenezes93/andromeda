import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export interface SignatureStepProps {
  onSign: (payload: { signerName: string; agreed: true }) => Promise<void>;
  loading?: boolean;
}

const CONSENT_LABEL =
  'Declaro que as informações fornecidas são verdadeiras e concordo com o uso dos dados conforme a Política de Privacidade e Termos de Uso.';

export function SignatureStep({ onSign, loading = false }: SignatureStepProps) {
  const [signerName, setSignerName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = signerName.trim();
    if (name.length < 2) {
      setError('Informe o nome completo (mínimo 2 caracteres).');
      return;
    }
    if (!agreed) {
      setError('É necessário concordar com a declaração para assinar.');
      return;
    }
    setSubmitting(true);
    try {
      await onSign({ signerName: name, agreed: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao assinar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-heading font-semibold text-content">Assinar anamnese</h2>
      <p className="mt-1 text-body-sm text-content-muted">
        Para concluir, assine eletronicamente declarando a veracidade das informações.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Nome completo do signatário *"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="Digite seu nome completo"
          required
          minLength={2}
          autoComplete="name"
          disabled={loading}
        />
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
            disabled={loading}
            aria-describedby="sign-consent-desc"
          />
          <span id="sign-consent-desc" className="text-body-sm text-content">
            {CONSENT_LABEL}
          </span>
        </label>
        {error && (
          <p className="text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting || loading} size="lg">
          Assinar e concluir
        </Button>
      </form>
    </Card>
  );
}
