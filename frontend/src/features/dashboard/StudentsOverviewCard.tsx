import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentsOverview } from '@/api/stats';
import type { StudentOverviewItem } from '@/api/stats';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

function AttentionBadge({ item }: { item: StudentOverviewItem }) {
  if (!item.attention) return <span className="text-body-sm text-content-subtle">—</span>;
  const variant =
    item.attentionSeverity === 'high'
      ? 'error'
      : item.attentionSeverity === 'medium'
        ? 'warning'
        : 'default';
  return <Badge variant={variant}>{item.attention}</Badge>;
}

export function StudentsOverviewCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['students-overview'],
    queryFn: getStudentsOverview,
  });

  const students = data?.students ?? [];

  if (error) {
    return (
      <Card title="Meus alunos (semana)" padding="md">
        <p className="text-body-sm text-error">
          {error instanceof Error ? error.message : 'Erro ao carregar.'}
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Meus alunos (semana)"
      padding="none"
      className="border-l-4 border-l-primary"
    >
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height={32} className="w-full" />
            <Skeleton height={32} className="w-full" />
            <Skeleton height={32} className="w-full" />
          </div>
        ) : students.length === 0 ? (
          <p className="text-body-sm text-content-muted">Nenhum paciente ativo.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-muted">
                    <th className="pb-2 pr-3 text-body-sm font-medium text-content-muted">
                      Aluno
                    </th>
                    <th className="pb-2 pr-3 text-body-sm font-medium text-content-muted">
                      Treino 7d
                    </th>
                    <th className="pb-2 pr-3 text-body-sm font-medium text-content-muted">
                      Dieta 7d
                    </th>
                    <th className="pb-2 text-body-sm font-medium text-content-muted">
                      Atenção
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((row) => (
                    <tr
                      key={row.patientId}
                      className="border-b border-border-muted last:border-b-0"
                    >
                      <td className="py-2.5 pr-3">
                        <Link
                          to={`/patients/${row.patientId}/hub`}
                          className="text-body font-medium text-primary hover:underline"
                        >
                          {row.fullName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-body-sm text-content">
                        {row.training7d}
                      </td>
                      <td className="py-2.5 pr-3 text-body-sm text-content">
                        {row.diet7d}
                      </td>
                      <td className="py-2.5">
                        <AttentionBadge item={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end">
              <Link
                to="/patients"
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
