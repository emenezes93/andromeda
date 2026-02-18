import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '@/api/users';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = 'admin' | 'practitioner' | 'viewer';

interface FormFields {
  email: string;
  password: string;
  name: string;
  role: Role;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validate(fields: FormFields): FormErrors {
  const errs: FormErrors = {};

  if (!fields.email.trim()) {
    errs.email = 'E-mail é obrigatório.';
  } else if (!EMAIL_RE.test(fields.email.trim())) {
    errs.email = 'E-mail inválido.';
  }

  if (!fields.password) {
    errs.password = 'Senha é obrigatória.';
  } else if (fields.password.length < 8) {
    errs.password = 'A senha deve ter pelo menos 8 caracteres.';
  } else if (!PASSWORD_RE.test(fields.password)) {
    errs.password =
      'A senha deve conter maiúscula, minúscula, número e símbolo.';
  }

  return errs;
}

// ---------------------------------------------------------------------------
// Role options
// ---------------------------------------------------------------------------

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Gerencia usuários, templates e sessões.',
  },
  {
    value: 'practitioner',
    label: 'Profissional',
    description: 'Cria e conduz sessões de anamnese.',
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    description: 'Somente leitura de sessões e insights.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InviteUserPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [fields, setFields] = useState<FormFields>({
    email: '',
    password: '',
    name: '',
    role: 'practitioner',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Field change handler
  // -------------------------------------------------------------------------

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the specific field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError(null);
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await createUser({
        email: fields.email.trim(),
        password: fields.password,
        name: fields.name.trim() || undefined,
        role: fields.role,
      });
      toast.success('Usuário convidado com sucesso.');
      navigate('/users');
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Erro ao convidar usuário.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-heading font-semibold text-content">
          Convidar usuário
        </h1>
        <p className="mt-1 text-body-sm text-content-muted">
          Adicione um novo membro ao tenant com as credenciais e o papel
          desejados.
        </p>
      </div>

      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
          {/* Email */}
          <Input
            label="E-mail *"
            type="email"
            name="email"
            id="email"
            autoComplete="off"
            placeholder="usuario@exemplo.com"
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
            disabled={submitting}
          />

          {/* Password */}
          <Input
            label="Senha *"
            type="password"
            name="password"
            id="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={fields.password}
            onChange={handleChange}
            error={errors.password}
            hint="Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo"
            disabled={submitting}
          />

          {/* Name (optional) */}
          <Input
            label="Nome completo (opcional)"
            type="text"
            name="name"
            id="name"
            autoComplete="off"
            placeholder="Ex.: Maria Silva"
            value={fields.name}
            onChange={handleChange}
            error={errors.name}
            disabled={submitting}
          />

          {/* Role select */}
          <div className="w-full">
            <label
              htmlFor="role"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Papel *
            </label>
            <select
              id="role"
              name="role"
              value={fields.role}
              onChange={handleChange}
              disabled={submitting}
              className="min-h-touch w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Role description hint */}
            <p className="mt-1.5 text-body-sm text-content-subtle">
              {ROLE_OPTIONS.find((o) => o.value === fields.role)?.description}
            </p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div
              className="rounded-button border border-error bg-error-light px-3 py-2.5 text-body-sm text-error"
              role="alert"
            >
              {apiError}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => navigate('/users')}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="tactile" loading={submitting}>
              Convidar usuário
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
