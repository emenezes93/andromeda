import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Patient, PatientEvolution, Goal, Session, TrainingExecution } from '@/types';

const colors = {
  text: '#1a1a2e',
  primary: '#6366f1',
  background: '#f8fafc',
  border: '#e2e8f0',
  muted: '#64748b',
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: colors.text,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 9,
    color: colors.muted,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: colors.muted,
  },
  value: {
    flex: 1,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '23%',
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: colors.muted,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    padding: 6,
    flex: 1,
    fontSize: 9,
  },
  tableCellFixed: {
    padding: 6,
    width: 60,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: colors.muted,
    textAlign: 'center',
  },
  goalItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: colors.background,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 2,
  },
  goalTitle: {
    fontWeight: 700,
    marginBottom: 2,
  },
  goalMeta: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 2,
  },
});

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export interface PatientReportPdfProps {
  patient: Patient;
  goals: Goal[];
  sessions: Session[];
  evolutions: PatientEvolution[];
  executions: TrainingExecution[];
  tenantName?: string;
}

export function PatientReportPdf({
  patient,
  goals,
  sessions,
  evolutions,
  executions,
  tenantName = 'Clínica',
}: PatientReportPdfProps) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const executionsLast30 = executions.filter((e) => new Date(e.executedAt) >= thirtyDaysAgo);
  const evolutionsLast6 = evolutions.slice(0, 6);
  const achievedGoals = goals.filter((g) => g.achievedAt != null);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{tenantName}</Text>
          <Text style={styles.headerMeta}>
            Relatório gerado em {formatDate(now.toISOString())}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do paciente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome</Text>
            <Text style={styles.value}>{patient.fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data de nascimento</Text>
            <Text style={styles.value}>{formatDate(patient.birthDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{patient.email ?? '—'}</Text>
          </View>
          {patient.mainGoal && (
            <View style={styles.row}>
              <Text style={styles.label}>Objetivo principal</Text>
              <Text style={styles.value}>{patient.mainGoal}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{sessions.length}</Text>
              <Text style={styles.statLabel}>Avaliações</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{achievedGoals.length}</Text>
              <Text style={styles.statLabel}>Metas concluídas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{executionsLast30.length}</Text>
              <Text style={styles.statLabel}>Treinos (30 dias)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{evolutions.length}</Text>
              <Text style={styles.statLabel}>Evoluções</Text>
            </View>
          </View>
        </View>

        {evolutionsLast6.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolução (últimos 6 registros)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 1 }]}>Data</Text>
                <Text style={[styles.tableCellFixed, { width: 50 }]}>Peso</Text>
                <Text style={[styles.tableCellFixed, { width: 50 }]}>% Gordura</Text>
                <Text style={[styles.tableCellFixed, { width: 44 }]}>IMC</Text>
                <Text style={[styles.tableCellFixed, { width: 50 }]}>Cintura</Text>
              </View>
              {evolutionsLast6.map((e) => (
                <View key={e.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(e.recordedAt)}</Text>
                  <Text style={[styles.tableCellFixed, { width: 50 }]}>
                    {e.weightKg != null ? `${e.weightKg} kg` : '—'}
                  </Text>
                  <Text style={[styles.tableCellFixed, { width: 50 }]}>
                    {e.bodyFatPercent != null ? `${e.bodyFatPercent}%` : '—'}
                  </Text>
                  <Text style={[styles.tableCellFixed, { width: 44 }]}>
                    {e.bmi != null ? e.bmi.toFixed(1) : '—'}
                  </Text>
                  <Text style={[styles.tableCellFixed, { width: 50 }]}>
                    {e.waistCm != null ? `${e.waistCm} cm` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metas</Text>
            {goals.map((g) => {
              const achieved = g.achievedAt != null;
              const overdue = !achieved && new Date(g.targetDate) < now;
              const progress =
                g.currentValue != null && g.targetValue > 0
                  ? `${g.currentValue} / ${g.targetValue} ${g.unit}`
                  : '—';
              const status = achieved
                ? 'Concluída'
                : overdue
                  ? 'Vencida'
                  : 'Em andamento';
              return (
                <View key={g.id} style={styles.goalItem}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.goalMeta}>
                    {g.type.replace('_', ' ')} · Prazo: {formatDate(g.targetDate)}
                  </Text>
                  <Text style={styles.goalMeta}>
                    Progresso: {progress} — {status}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {executionsLast30.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treinos — últimos 30 dias</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 1 }]}>Data</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>Plano</Text>
                <Text style={[styles.tableCellFixed, { width: 56 }]}>Duração</Text>
                <Text style={[styles.tableCellFixed, { width: 64 }]}>Status</Text>
              </View>
              {executionsLast30.map((e) => (
                <View key={e.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(e.executedAt)}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {e.planName ?? '—'}
                  </Text>
                  <Text style={[styles.tableCellFixed, { width: 56 }]}>
                    {e.durationMinutes != null ? `${e.durationMinutes} min` : '—'}
                  </Text>
                  <Text style={[styles.tableCellFixed, { width: 64 }]}>
                    {e.completed ? 'Concluído' : 'Parcial'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avaliações recentes</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 1 }]}>Data</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>Template</Text>
                <Text style={[styles.tableCellFixed, { width: 70 }]}>Status</Text>
              </View>
              {sessions.slice(0, 15).map((s) => (
                <View key={s.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(s.createdAt)}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {s.template?.name ?? s.templateId.slice(0, 8)}
                  </Text>
                  <Text style={[styles.tableCellFixed, { width: 70 }]}>
                    {s.status === 'completed'
                      ? 'Concluída'
                      : s.status === 'cancelled'
                        ? 'Cancelada'
                        : 'Em andamento'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Gerado por Fit Insight em {formatDate(now.toISOString())}
        </Text>
      </Page>
    </Document>
  );
}
