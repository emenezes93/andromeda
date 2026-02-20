import type { PrismaClient } from '@prisma/client';
import { Goal } from '@domain/entities/Goal.js';
import type {
  IGoalRepository,
  GoalCreateData,
  GoalUpdateData,
  GoalListOpts,
  GoalListEntry,
  PaginatedGoals,
} from '@ports/repositories/IGoalRepository.js';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(tenantId: string, opts: GoalListOpts): Promise<PaginatedGoals> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (opts.patientId) where.patientId = opts.patientId;
    if (opts.type) where.type = opts.type;
    if (opts.achieved === true) where.achievedAt = { not: null };
    else if (opts.achieved === false) where.achievedAt = null;

    const skip = (opts.page - 1) * opts.limit;
    const [rows, total] = await Promise.all([
      this.prisma.patientGoal.findMany({
        where,
        skip,
        take: opts.limit,
        orderBy: { targetDate: 'asc' },
        include: { patient: { select: { fullName: true } } },
      }),
      this.prisma.patientGoal.count({ where }),
    ]);

    const data: GoalListEntry[] = rows.map((r) => ({
      goal: this.toDomain(r),
      patientName: r.patient.fullName,
    }));
    return { data, total };
  }

  async findById(id: string, tenantId: string): Promise<Goal | null> {
    const row = await this.prisma.patientGoal.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: GoalCreateData): Promise<Goal> {
    const created = await this.prisma.patientGoal.create({
      data: {
        tenantId: data.tenantId,
        patientId: data.patientId,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        currentValue: data.currentValue ?? null,
        targetValue: data.targetValue,
        unit: data.unit,
        startDate: data.startDate,
        targetDate: data.targetDate,
      },
    });
    return this.toDomain(created);
  }

  async update(id: string, tenantId: string, data: GoalUpdateData): Promise<Goal> {
    const existing = await this.prisma.patientGoal.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error('Goal not found');
    const updated = await this.prisma.patientGoal.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description ?? null }),
        ...(data.currentValue !== undefined && { currentValue: data.currentValue ?? null }),
        ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
        ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
        ...(data.achievedAt !== undefined && { achievedAt: data.achievedAt ?? null }),
      },
    });
    return this.toDomain(updated);
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const existing = await this.prisma.patientGoal.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error('Goal not found');
    await this.prisma.patientGoal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(r: {
    id: string;
    tenantId: string;
    patientId: string;
    type: string;
    title: string;
    description: string | null;
    currentValue: number | null;
    targetValue: number;
    unit: string;
    startDate: Date;
    targetDate: Date;
    achievedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Goal {
    return new Goal(
      r.id,
      r.tenantId,
      r.patientId,
      r.type as Goal['type'],
      r.title,
      r.description,
      r.currentValue,
      r.targetValue,
      r.unit,
      r.startDate,
      r.targetDate,
      r.achievedAt,
      r.createdAt,
      r.updatedAt,
      r.deletedAt
    );
  }
}
