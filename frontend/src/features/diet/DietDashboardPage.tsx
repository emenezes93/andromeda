import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDietStats, listDietEntries } from '@/api/diet';
import { LineChart } from '@/components/charts/LineChart';
import type { LineDataPoint } from '@/components/charts/LineChart';
import type { DietStats, DietEntry } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

const MEAL_LABELS: Record<string, string> = {
  breakfast: '☀️ Café da Manhã',
  lunch: '🥗 Almoço',
  dinner: '🌙 Jantar',
  snack: '🍎 Lanche',
  other: '🍽️ Outro',
};

const BADGE_META: Record<string, { icon: string; label: string }> = {
  primeira_refeicao: { icon: '🍽️', label: '1ª Refeição' },
  '3_dias_seguidos': { icon: '🔥', label: '3 dias' },
  '7_dias_seguidos': { icon: '⚡', label: '7 dias' },
  '30_dias_seguidos': { icon: '🏆', label: '30 dias' },
  '50_refeicoes': { icon: '💪', label: '50 refeições' },
  '100_refeicoes': { icon: '🌟', label: '100 refeições' },
  meta_peso_atingida: { icon: '🎯', label: 'Meta peso' },
};

const ALL_BADGES = Object.keys(BADGE_META);

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-surface-muted text-content-muted border-border',
  dedicated: 'bg-primary-subtle text-primary border-primary/20',
  advanced: 'bg-warning-light text-warning border-warning/20',
  elite: 'bg-success-light text-success border-success/20',
};

// Anel circular de progresso SVG
function MacroRing({
  label,
  current,
  goal,
  color,
  unit = 'g',
}: {
  label: string;
  current: number;
  goal: number | null;
  color: string;
  unit?: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = goal && goal > 0 ? Math.min(1, current / goal) : 0;
  const offset = circumference - pct * circumference;
  const displayPct = goal ? Math.round(pct * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="88" height="88" viewBox="0 0 88 88" aria-label={label}>
          {/* Track */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          {/* Text */}
          <text x="44" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">
            {displayPct}%
          </text>
          <text x="44" y="55" textAnchor="middle" fontSize="10" fill="var(--color-content-muted)">
            {Math.round(current)}{unit}
          </text>
        </svg>
      </div>
      <span className="text-body-sm font-medium text-content">{label}</span>
      {goal && (
        <span className="text-xs text-content-subtle">meta: {goal}{unit}</span>
      )}
    </div>
  );
}

// XP Progress bar
function XpBar({ xp, nextLevelXp, progress }: { xp: number; nextLevelXp: number; progress: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-body-sm">
        <span className="font-medium text-content">{xp} XP</span>
        <span className="text-content-subtle">Próximo nível: {nextLevelXp < 9999 ? nextLevelXp : '—'} XP</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function DietDashboardPage() {
  const { patientId } = useParams<{ patientId: string }>();

  const { data: stats, isLoading: loadingStats } = useQuery<DietStats>({
    queryKey: ['diet-stats', patientId],
    queryFn: () => getDietStats(patientId!),
    enabled: !!patientId,
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntriesData, isLoading: loadingEntries } = useQuery({
    queryKey: ['diet-entries-today', patientId, today],
    queryFn: () => listDietEntries({ patientId: patientId!, from: today, to: today, limit: 20 }),
    enabled: !!patientId,
  });

  const todayEntries: DietEntry[] = todayEntriesData?.data ?? [];

  // Preparar dados para os gráficos
  const weightData: LineDataPoint[] =
    stats?.bodyMetrics
      .filter((m) => m.weightKg != null)
      .map((m) => ({ date: m.date, label: formatDate(m.date), value: m.weightKg! })) ?? [];

  const fatData: LineDataPoint[] =
    stats?.bodyMetrics
      .filter((m) => m.bodyFatPercent != null)
      .map((m) => ({ date: m.date, label: formatDate(m.date), value: m.bodyFatPercent! })) ?? [];

  const leanData: LineDataPoint[] =
    stats?.bodyMetrics
      .filter((m) => m.leanMassKg != null)
      .map((m) => ({ date: m.date, label: formatDate(m.date), value: m.leanMassKg! })) ?? [];

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const plan = stats.activePlan;
  const levelColorClass = LEVEL_COLORS[stats.level] ?? LEVEL_COLORS.beginner;

  return (
    <div className="space-y-6">
      {/* ── HERO: Nível + Streak ── */}
      <Card padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Nível badge */}
            <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 text-center ${levelColorClass}`}>
              <span className="text-xl font-bold leading-none">
                {stats.level === 'elite' ? '🏆' : stats.level === 'advanced' ? '⚡' : stats.level === 'dedicated' ? '💪' : '🌱'}
              </span>
            </div>
            <div>
              <h2 className="text-heading-sm font-bold text-content">{stats.levelLabel}</h2>
              <p className="text-body-sm text-content-muted">{stats.totalEntries} refeições registradas</p>
              <XpBar xp={stats.xpTotal} nextLevelXp={stats.nextLevelXp} progress={stats.xpProgress} />
            </div>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center rounded-xl border border-warning/30 bg-warning-light px-6 py-3 text-center">
            <span className="text-3xl">🔥</span>
            <span className="text-2xl font-bold text-warning">{stats.streak}</span>
            <span className="text-body-sm text-warning/80">dias seguidos</span>
          </div>
        </div>
      </Card>

      {/* ── BADGES / CONQUISTAS ── */}
      <div>
        <h3 className="mb-3 text-body-sm font-semibold uppercase tracking-wider text-content-muted">
          Conquistas
        </h3>
        <div className="flex flex-wrap gap-3">
          {ALL_BADGES.map((key) => {
            const meta = BADGE_META[key];
            const earned = stats.badges.includes(key);
            return (
              <div
                key={key}
                title={meta.label}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-calm ${
                  earned
                    ? 'border-primary/30 bg-primary-subtle text-primary shadow-sm'
                    : 'border-border bg-surface-muted text-content-subtle opacity-40 grayscale'
                }`}
              >
                <span className="text-xl">{meta.icon}</span>
                <span className="text-xs font-medium">{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MACRO RINGS (hoje) ── */}
      <Card padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body font-semibold text-content">Macros de Hoje</h3>
          {plan ? (
            <Badge variant="primary">{plan.name}</Badge>
          ) : (
            <Link to="/diet-plans/new" className="text-body-sm text-primary hover:underline">
              + Criar plano
            </Link>
          )}
        </div>

        {plan ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MacroRing
              label="Calorias"
              current={stats.todaySummary.calories}
              goal={plan.caloriesKcal}
              color="#f97316"
              unit="kcal"
            />
            <MacroRing
              label="Proteínas"
              current={stats.todaySummary.proteinG}
              goal={plan.proteinG}
              color="#3b82f6"
            />
            <MacroRing
              label="Carboidratos"
              current={stats.todaySummary.carbsG}
              goal={plan.carbsG}
              color="#a855f7"
            />
            <MacroRing
              label="Gorduras"
              current={stats.todaySummary.fatG}
              goal={plan.fatG}
              color="#eab308"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-content-muted">Nenhum plano ativo.</p>
            <p className="mt-1 text-body-sm text-content-subtle">
              Crie um plano para acompanhar suas metas diárias.
            </p>
          </div>
        )}

        {/* Água */}
        {plan?.waterMl && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-4 py-2.5">
            <span className="text-xl">💧</span>
            <div className="flex-1">
              <div className="flex justify-between text-body-sm">
                <span className="font-medium text-content">Água</span>
                <span className="text-content-muted">
                  {stats.todaySummary.waterMl}ml / {plan.waterMl}ml
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all"
                  style={{ width: `${Math.min(100, (stats.todaySummary.waterMl / plan.waterMl) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── REFEIÇÕES DE HOJE ── */}
      <div>
        <h3 className="mb-3 text-body font-semibold text-content">Refeições de Hoje</h3>
        {loadingEntries ? (
          <Skeleton className="h-24 w-full rounded-card" />
        ) : todayEntries.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-content-muted">Nenhuma refeição registrada hoje.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayEntries.map((entry) => (
              <Card key={entry.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-content">
                      {MEAL_LABELS[entry.mealType] ?? entry.mealType}
                    </p>
                    <p className="text-body-sm text-content-muted">
                      {(entry.foodsJson as Array<{name: string}>).map((f) => f.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-right text-body-sm">
                    {entry.totalCalories != null && (
                      <p className="font-semibold text-content">{entry.totalCalories} kcal</p>
                    )}
                    {entry.totalProteinG != null && (
                      <p className="text-content-muted">P: {Math.round(entry.totalProteinG)}g</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── GRÁFICOS DE COMPOSIÇÃO CORPORAL ── */}
      {stats.bodyMetrics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-body font-semibold text-content">Evolução Corporal</h3>

          {weightData.length > 1 && (
            <Card padding="md">
              <h4 className="mb-3 text-body-sm font-medium text-content-muted">
                ⚖️ Peso (kg)
              </h4>
              <LineChart data={weightData} color="#0ea5e9" yAxisLabel="kg" />
            </Card>
          )}

          {fatData.length > 1 && (
            <Card padding="md">
              <h4 className="mb-3 text-body-sm font-medium text-content-muted">
                🔴 Gordura Corporal (%)
              </h4>
              <LineChart data={fatData} color="#ef4444" yAxisLabel="%" />
            </Card>
          )}

          {leanData.length > 1 && (
            <Card padding="md">
              <h4 className="mb-3 text-body-sm font-medium text-content-muted">
                💪 Massa Magra (kg)
              </h4>
              <LineChart data={leanData} color="#22c55e" yAxisLabel="kg" />
            </Card>
          )}

          {weightData.length <= 1 && fatData.length <= 1 && leanData.length <= 1 && (
            <Card padding="md">
              <p className="text-center text-content-muted">
                Registre evoluções corporais para ver os gráficos aqui.
              </p>
              <div className="mt-2 text-center">
                <Link
                  to={`/patients/${patientId}/evolution`}
                  className="text-body-sm text-primary hover:underline"
                >
                  Registrar medidas →
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {stats.bodyMetrics.length === 0 && (
        <Card padding="md">
          <div className="text-center">
            <p className="text-content-muted">Nenhuma evolução corporal registrada ainda.</p>
            <p className="mt-1 text-body-sm text-content-subtle">
              Registre o peso e composição corporal para ver os gráficos.
            </p>
            <Link
              to={`/patients/${patientId}/evolution`}
              className="mt-3 inline-block text-body-sm text-primary hover:underline"
            >
              Registrar medidas →
            </Link>
          </div>
        </Card>
      )}

      {/* ── ADESÃO DA SEMANA ── */}
      {plan && stats.macroAdherence > 0 && (
        <Card padding="md">
          <h3 className="mb-3 text-body font-semibold text-content">Adesão ao Plano (7 dias)</h3>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-border)" strokeWidth="10" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke={stats.macroAdherence >= 80 ? '#22c55e' : stats.macroAdherence >= 50 ? '#f97316' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${(stats.macroAdherence / 100) * 201} 201`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-content">
                {stats.macroAdherence}%
              </span>
            </div>
            <div>
              <p className="font-medium text-content">
                {stats.macroAdherence >= 80
                  ? 'Excelente adesão! Continue assim! 🎉'
                  : stats.macroAdherence >= 50
                    ? 'Boa adesão, mas pode melhorar 💪'
                    : 'Vamos retomar o foco! 🎯'}
              </p>
              <p className="text-body-sm text-content-muted">
                Média de calorias nos últimos 7 dias em relação à meta.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
