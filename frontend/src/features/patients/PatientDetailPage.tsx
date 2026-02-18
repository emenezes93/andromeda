import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient } from '@/api/patients';
import { listSessions } from '@/api/sessions';
import type { PatientWithCount, Session } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateShort(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function genderLabel(gender: string | null | undefined): string {
  if (!gender) return 'Não informado';
  const labels: Record<string, string> = {
    M: 'Masculino',
    F: 'Feminino',
    Other: 'Outro',
    'Prefer not to say': 'Prefere não dizer',
  };
  return labels[gender] ?? gender;
}

function genderVariant(
  gender: string | null | undefined,
): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  if (gender === 'M') return 'primary';
  if (gender === 'F') return 'success';
  return 'default';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

function InfoRow({ label, value }: InfoRowProps) {
  const display = value !== null && value !== undefined && value !== '' ? String(value) : '—';
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-body-sm font-medium text-content-muted">{label}</dt>
      <dd className="text-body text-content">{display}</dd>
    </div>
  );
}

interface TextCardProps {
  title: string;
  text: string;
}

function TextCard({ title, text }: TextCardProps) {
  return (
    <Card title={title} padding="md">
      <p className="text-body text-content leading-relaxed whitespace-pre-wrap">{text}</p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [patient, setPatient] = useState<PatientWithCount | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [patientError, setPatientError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoadingPatient(true);
    setPatientError(null);
    getPatient(id)
      .then(setPatient)
      .catch((err) =>
        setPatientError(err instanceof Error ? err.message : 'Erro ao carregar paciente'),
      )
      .finally(() => setLoadingPatient(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    setLoadingSessions(true);
    listSessions({ page: 1, limit: 50 })
      .then((res) => {
        // Filter client-side by patientId since the API has no patient filter param
        const filtered = res.data.filter((s) => s.patientId === id);
        setSessions(filtered.slice(0, 5));
      })
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, [id]);

  // ── Guards ──────────────────────────────────────────────────────────────

  if (!id) {
    return <p className="text-content-muted">ID do paciente não informado.</p>;
  }

  if (loadingPatient) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <Card className="border-error bg-error-light" padding="md">
        <p className="text-error">{patientError ?? 'Paciente não encontrado.'}</p>
        <Link to="/patients" className="mt-4 inline-block">
          <Button variant="secondary">Voltar à lista</Button>
        </Link>
      </Card>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-heading font-semibold text-content">{patient.fullName}</h2>
          <Badge variant={genderVariant(patient.gender)}>{genderLabel(patient.gender)}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/patients/${id}/edit`}>
            <Button variant="secondary" size="sm">
              Editar
            </Button>
          </Link>
          <Link to={`/sessions/new?patientId=${id}`}>
            <Button size="sm">Nova sessão</Button>
          </Link>
        </div>
      </div>

      {/* ── Dados do paciente ── */}
      <Card title="Dados do paciente" padding="md">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="Data de nascimento" value={formatDate(patient.birthDate)} />
          <InfoRow label="CPF" value={patient.cpf} />
          <InfoRow label="Email" value={patient.email} />
          <InfoRow label="Telefone" value={patient.phone} />
          <InfoRow label="Profissão" value={patient.profession} />
          <div className="flex flex-col gap-0.5">
            <dt className="text-body-sm font-medium text-content-muted">Sessões / Evoluções</dt>
            <dd className="flex items-center gap-3 text-body text-content">
              <span>
                <span className="font-semibold text-primary">{patient._count.sessions}</span>{' '}
                <span className="text-content-muted">sessões</span>
              </span>
              <span className="text-border-soft">·</span>
              <span>
                <span className="font-semibold text-primary">{patient._count.evolutions}</span>{' '}
                <span className="text-content-muted">evoluções</span>
              </span>
            </dd>
          </div>
        </dl>
      </Card>

      {/* ── Optional text cards ── */}
      {patient.mainGoal && <TextCard title="Objetivo principal" text={patient.mainGoal} />}
      {patient.mainComplaint && (
        <TextCard title="Queixa principal" text={patient.mainComplaint} />
      )}
      {patient.notes && <TextCard title="Observações" text={patient.notes} />}

      {/* ── Sessões recentes ── */}
      <Card title="Sessões recentes" padding="none">
        {loadingSessions ? (
          <div className="flex justify-center py-10">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-5 py-8">
            <p className="text-body text-content-muted">
              Nenhuma sessão registrada para este paciente.
            </p>
            <Link to={`/sessions/new?patientId=${id}`} className="mt-3 inline-block">
              <Button size="sm">Criar sessão</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-border-muted bg-surface-muted">
                    <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                    <th className="px-4 py-3 font-medium text-content-muted">Template</th>
                    <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-content-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border-muted transition-calm last:border-0 hover:bg-surface-muted"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                        {formatDateShort(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-content">
                        {s.template?.name ?? s.templateId.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3">
                        {s.status && <SessionStatusBadge status={s.status} />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/sessions/${s.id}`} className="mr-2">
                          <Button variant="ghost" size="sm">
                            Ver
                          </Button>
                        </Link>
                        {s.status !== 'completed' && s.status !== 'cancelled' && (
                          <Link to={`/sessions/${s.id}/flow`}>
                            <Button size="sm" variant="secondary">
                              Continuar
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border-muted px-4 py-3">
              <Link
                to="/sessions"
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Ver todas as sessões →
              </Link>
            </div>
          </>
        )}
      </Card>

      {/* ── Action strip ── */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link to={`/patients/${id}/evolution`}>
          <Button variant="outline">Ver evolução</Button>
        </Link>
        <Link to="/patients">
          <Button variant="secondary">Voltar à lista</Button>
        </Link>
      </div>
    </div>
  );
}
