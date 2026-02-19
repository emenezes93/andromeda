export interface AchievementMilestone {
  count: number;
  label: string;
  emoji: string;
  level: string;
}

const MILESTONES: AchievementMilestone[] = [
  { count: 1, label: 'Primeira sessão', emoji: '🌱', level: 'Iniciante' },
  { count: 5, label: 'Em progresso', emoji: '📋', level: 'Em progresso' },
  { count: 10, label: 'Dez concluídas', emoji: '⭐', level: 'Praticante' },
  { count: 25, label: 'Vinte e cinco', emoji: '🏅', level: 'Avançado' },
  { count: 50, label: 'Expert', emoji: '🎯', level: 'Expert' },
  { count: 100, label: 'Centenário', emoji: '💯', level: 'Mestre' },
];

interface AchievementsCardProps {
  completedTotal: number | null;
  completedThisWeek?: number;
  loading?: boolean;
}

function getNextMilestone(completed: number): AchievementMilestone | null {
  return MILESTONES.find((m) => m.count > completed) ?? null;
}

function getCurrentLevel(completed: number): AchievementMilestone | null {
  let current: AchievementMilestone | null = null;
  for (const m of MILESTONES) {
    if (completed >= m.count) current = m;
    else break;
  }
  return current;
}

export function AchievementsCard({
  completedTotal,
  completedThisWeek = 0,
  loading,
}: AchievementsCardProps) {
  const completed = completedTotal ?? 0;
  const next = getNextMilestone(completed);
  const currentLevel = getCurrentLevel(completed);
  const progress = next
    ? Math.min(100, (completed / next.count) * 100)
    : 100;

  return (
    <div className="card-achievements rounded-2xl border p-5 transition-calm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl"
            aria-hidden
          >
            🏆
          </div>
          <div>
            <h3 className="text-heading-sm font-semibold text-content">Sua evolução</h3>
            <p className="text-body-sm text-content-muted">
              {currentLevel
                ? `${currentLevel.emoji} ${currentLevel.level}`
                : 'Complete sessões para subir de nível'}
            </p>
          </div>
        </div>
        {completedThisWeek > 0 && (
          <div className="rounded-full bg-primary-light px-3 py-1.5 text-body-sm font-medium text-primary">
            Esta semana: <span className="tabular-nums">{completedThisWeek}</span>{' '}
            {completedThisWeek === 1 ? 'sessão' : 'sessões'}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-5 flex h-24 items-center justify-center">
          <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-primary">{completed}</span>
            <span className="text-body-sm text-content-muted">
              {completed === 1 ? 'sessão concluída' : 'sessões concluídas'}
            </span>
          </div>

          {next && (
            <div className="mt-4">
              <div className="flex justify-between text-body-sm text-content-muted">
                <span>
                  Próximo: {next.emoji} {next.label}
                </span>
                <span className="tabular-nums">{next.count - completed} restantes</span>
              </div>
              <div
                className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-muted"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso para ${next.label}`}
              >
                <div
                  className="progress-bar-gradient h-full rounded-full transition-all duration-700 ease-out motion-reduce:animate-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div
            className="mt-5 flex flex-wrap gap-2"
            role="list"
            aria-label="Conquistas desbloqueadas"
          >
            {MILESTONES.map((m) => {
              const unlocked = completed >= m.count;
              return (
                <span
                  key={m.count}
                  role="listitem"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm transition-all ${
                    unlocked
                      ? 'badge-unlocked bg-primary-light font-medium text-primary'
                      : 'bg-surface-muted text-content-subtle opacity-70'
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
