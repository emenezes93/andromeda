/**
 * Domain Entity: Patient Goal
 */
export type GoalType = 'weight_loss' | 'muscle_gain' | 'performance' | 'health' | 'other';

export class Goal {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly type: GoalType,
    public readonly title: string,
    public readonly description: string | null,
    public readonly currentValue: number | null,
    public readonly targetValue: number,
    public readonly unit: string,
    public readonly startDate: Date,
    public readonly targetDate: Date,
    public readonly achievedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null = null
  ) {}

  isAchieved(): boolean {
    return this.achievedAt != null;
  }

  isDeleted(): boolean {
    return this.deletedAt != null;
  }

  progressPercent(): number | null {
    if (this.currentValue === null || this.targetValue === null) return null;
    return Math.min(100, Math.max(0, (this.currentValue / this.targetValue) * 100));
  }
}
