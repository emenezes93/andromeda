export interface AchievementMilestone {
  count: number;
  label: string;
  emoji: string;
}

const MILESTONES: AchievementMilestone[] = [
  { count: 1, label: 'Primeira sessão', emoji: '🌱' },
  { count: 5, label: 'Em progresso', emoji: '📋' },
  { count: 10, label: 'Dez concluídas', emoji: '⭐' },
  { count: 25, label: 'Praticante', emoji: '🏅' },
  { count: 50, label: 'Expert', emoji: '🎯' },
  { count: 100, label: 'Centenário', emoji: '💯' },
];

interface AchievementsCardProps {
  completedTotal: number | null;
  loading?: boolean;
}

function getNextMilestone(completed: number): AchievementMilestone | null {
  return MILESTONES.find((m) => m.count > completed) ?? null;
}

export function AchievementsCard({ completedTotal, loading }: AchievementsCardProps) {
  const completed = completedTotal ?? 0;
  const next = getNextMilestone(completed);
  const progress = next
    ? Math.min(100, (completed / next.count) * 100)
    : 100;

  return (
    <div className="rounded-2xl border border-border-muted bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>🏆</span>
        <h3 className="text-heading-sm font-semibold text-content">Sua evolução</h3>
      </div>
      <p className="mt-1 text-body-sm text-content-muted">
        Sessões de anamnese concluídas com insights gerados.
      </p>

      {loading ? (
        <div className="mt-4 flex h-20 items-center justify-center">
          <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-heading-lg font-bold tabular-nums text-primary">
              {completed}
            </span>
            <span className="text-body-sm text-content-muted">
              {completed === 1 ? 'sessão concluída' : 'sessões concluídas'}
            </span>
          </div>

          {next && (
            <div className="mt-3">
              <div className="flex justify-between text-body-sm text-content-muted">
                <span>Próximo: {next.emoji} {next.label}</span>
                <span>{next.count - completed} restantes</span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso para ${next.label}`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2" role="list" aria-label="Conquistas desbloqueadas">
            {MILESTONES.map((m) => {
              const unlocked = completed >= m.count;
              return (
                <span
                  key={m.count}
                  role="listitem"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-body-sm transition-all ${
                    unlocked
                      ? 'bg-primary-light text-primary'
                      : 'bg-surface-muted text-content-subtle opacity-60'
                  }`}
                  title={unlocked ? m.label : `${m.label} (${m.count} sessões)`}
                >
                  <span aria-hidden>{m.emoji}</span>
                  <span>{m.count}</span>
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
