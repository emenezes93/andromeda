import { useEffect, useState, useMemo } from 'react';
import { getPatient, listEvolutions } from '@/api/patients';
import type { Patient, PatientEvolution } from '@/types';
import { Card } from '@/components/ui/Card';
import { LineChart, type LineDataPoint } from '@/components/charts';
import { Skeleton } from '@/components/ui/Skeleton';

interface PatientDataIntegrationProps {
  patientId: string | null | undefined;
}

export function PatientDataIntegration({ patientId }: PatientDataIntegrationProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [evolutions, setEvolutions] = useState<PatientEvolution[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    Promise.all([getPatient(patientId), listEvolutions(patientId)])
      .then(([p, e]) => {
        setPatient(p);
        setEvolutions(e.data);
      })
      .catch(() => {
        // Silently fail if patient data is not available
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  const evolutionChartData = useMemo<LineDataPoint[]>(() => {
    if (evolutions.length === 0) return [];
    return evolutions
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((e) => ({
        date: e.recordedAt,
        label: new Date(e.recordedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        value: e.weightKg || 0,
      }))
      .filter((d) => d.value > 0);
  }, [evolutions]);

  const latestEvolution = evolutions.length > 0 ? evolutions[evolutions.length - 1] : null;

  if (!patientId) return null;

  if (loading) {
    return (
      <Card title="Dados do Paciente" padding="md">
        <Skeleton height={200} />
      </Card>
    );
  }

  if (!patient) return null;

  return (
    <div className="space-y-4">
      <Card title="Informações do Paciente" padding="md">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-body-sm text-content-muted">Nome</p>
            <p className="text-body font-semibold text-content">{patient.fullName}</p>
          </div>
          {patient.birthDate && (
            <div>
              <p className="text-body-sm text-content-muted">Data de nascimento</p>
              <p className="text-body font-semibold text-content">
                {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
          {patient.gender && (
            <div>
              <p className="text-body-sm text-content-muted">Gênero</p>
              <p className="text-body font-semibold text-content">{patient.gender}</p>
            </div>
          )}
          {patient.mainGoal && (
            <div>
              <p className="text-body-sm text-content-muted">Objetivo principal</p>
              <p className="text-body font-semibold text-content">{patient.mainGoal}</p>
            </div>
          )}
        </div>
      </Card>

      {latestEvolution && (
        <Card title="Últimas Medidas" padding="md">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latestEvolution.weightKg && (
              <div>
                <p className="text-body-sm text-content-muted">Peso</p>
                <p className="text-heading font-bold text-content">
                  {latestEvolution.weightKg.toFixed(1)} kg
                </p>
              </div>
            )}
            {latestEvolution.heightCm && (
              <div>
                <p className="text-body-sm text-content-muted">Altura</p>
                <p className="text-heading font-bold text-content">
                  {latestEvolution.heightCm.toFixed(0)} cm
                </p>
              </div>
            )}
            {latestEvolution.bmi && (
              <div>
                <p className="text-body-sm text-content-muted">IMC</p>
                <p className="text-heading font-bold text-content">
                  {latestEvolution.bmi.toFixed(1)}
                </p>
              </div>
            )}
            {latestEvolution.waistHipRatio && (
              <div>
                <p className="text-body-sm text-content-muted">RCQ</p>
                <p className="text-heading font-bold text-content">
                  {latestEvolution.waistHipRatio.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {evolutionChartData.length > 1 && (
        <Card title="Evolução do Peso" padding="md">
          <LineChart data={evolutionChartData} yAxisLabel="Peso (kg)" color="#0ea5e9" />
        </Card>
      )}
    </div>
  );
}
