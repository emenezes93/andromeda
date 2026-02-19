import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listPatients } from '@/api/patients';
import type { PatientListResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function genderLabel(gender: string | null): string {
  if (gender === 'M') return 'Masculino';
  if (gender === 'F') return 'Feminino';
  if (gender === 'Other') return 'Outro';
  if (gender === 'Prefer not to say') return 'Prefere não informar';
  return '—';
}

function genderBadgeVariant(gender: string | null): 'primary' | 'default' | 'success' {
  if (gender === 'M') return 'primary';
  if (gender === 'F') return 'success';
  return 'default';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LIMIT = 12;
const DEBOUNCE_MS = 400;

export function PatientsListPage() {
  const [data, setData] = useState<PatientListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPatients = useCallback(() => {
    setLoading(true);
    setError(null);
    listPatients({ page, limit: LIMIT, search: debouncedSearch || undefined })
      .then((res) => setData(res))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // --------------------------------------------------------------------------
  // Loading (initial / hard loading — no cached data yet)
  // --------------------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Error state
  // --------------------------------------------------------------------------
  if (error && !data) {
    return (
      <div className="rounded-card border border-error bg-error-light p-5 shadow-card">
        <p className="font-medium text-error">{error}</p>
        <Button className="mt-4" onClick={fetchPatients}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const patients = data?.data ?? [];
  const meta = data?.meta;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            name="search"
            aria-label="Buscar pacientes"
          />
        </div>
        <Link to="/patients/new">
          <Button>Novo paciente</Button>
        </Link>
      </div>

      {/* Soft error banner (data already loaded but re-fetch failed) */}
      {error && data && (
        <div className="rounded-card border border-error bg-error-light px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Count label */}
      {meta && (
        <p className="text-sm text-content-muted">
          {meta.total === 0
            ? 'Nenhum paciente encontrado'
            : `${meta.total} paciente${meta.total !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Soft loading indicator (background refresh while data is shown) */}
      {loading && data && (
        <div className="flex justify-center py-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && patients.length === 0 && (
        <Card>
          <p className="text-content-muted">
            {debouncedSearch
              ? `Nenhum paciente encontrado para "${debouncedSearch}".`
              : 'Nenhum paciente cadastrado ainda.'}
          </p>
          {!debouncedSearch && (
            <Link to="/patients/new">
              <Button className="mt-4">Novo paciente</Button>
            </Link>
          )}
        </Card>
      )}

      {/* Patient grid */}
      {patients.length > 0 && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <li key={patient.id}>
                <Link to={`/patients/${patient.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-card">
                  <Card className="h-full transition-shadow hover:shadow-card-hover" padding="md">
                    {/* Name + gender badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-content leading-snug break-words flex-1">
                        {patient.fullName}
                      </h3>
                      {patient.gender && (
                        <Badge variant={genderBadgeVariant(patient.gender)} className="shrink-0">
                          {genderLabel(patient.gender)}
                        </Badge>
                      )}
                    </div>

                    {/* CPF */}
                    <p className="mt-2 text-sm text-content-muted">
                      <span className="font-medium text-content-subtle">CPF:</span>{' '}
                      {patient.cpf ? maskCpf(patient.cpf) : '—'}
                    </p>

                    {/* Email */}
                    <p className="mt-1 text-sm text-content-muted truncate">
                      <span className="font-medium text-content-subtle">E-mail:</span>{' '}
                      {patient.email ?? '—'}
                    </p>

                    {/* Session / evolution counters */}
                    <div className="mt-3 flex gap-3 border-t border-border pt-3">
                      <span className="inline-flex items-center gap-1 rounded-button bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                        {patient._count?.sessions ?? 0} sessão(ões)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-button bg-surface-muted px-2 py-0.5 text-xs font-medium text-content-muted">
                        {patient._count?.evolutions ?? 0} evolução(ões)
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-content-muted">
                Página {page} de {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
