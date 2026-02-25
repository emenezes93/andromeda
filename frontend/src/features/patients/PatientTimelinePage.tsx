import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient, getPatientTimeline } from '@/api/patients';
import type { PatientWithCount, PatientTimelineEvent } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TimelineItem } from '@/components/ui/TimelineItem';

export function PatientTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientWithCount | null>(null);
  const [events, setEvents] = useState<PatientTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getPatient(id), getPatientTimeline(id)])
      .then(([p, timeline]) => {
        setPatient(p);
        setEvents(timeline.events);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar prontuário'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return <p className="text-content-muted">ID do paciente não informado.</p>;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-error bg-error-light" padding="md">
        <p className="text-error">{error}</p>
        <Link to={`/patients/${id}`} className="mt-4 inline-block">
          <Button variant="secondary">Voltar ao paciente</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-heading font-semibold text-content">
            Prontuário completo
          </h2>
          {patient && (
            <p className="mt-0.5 text-body-sm text-content-muted">{patient.fullName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/sessions/new?patientId=${id}`}>
            <Button size="sm">Nova sessão</Button>
          </Link>
          <Link to={`/patients/${id}`}>
            <Button variant="secondary" size="sm">Voltar ao paciente</Button>
          </Link>
        </div>
      </div>

      <Card padding="none">
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-body text-content-muted">Nenhum evento registrado ainda.</p>
            <p className="mt-1 text-body-sm text-content-subtle">
              Sessões, evoluções e metas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="px-4 py-2">
            {events.map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                isLast={index === events.length - 1}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
