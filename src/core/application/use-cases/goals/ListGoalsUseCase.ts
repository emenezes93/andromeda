import type { IGoalRepository } from '@ports/repositories/IGoalRepository.js';

export interface ListGoalsRequest {
  tenantId: string;
  page: number;
  limit: number;
  patientId?: string;
  type?: string;
  achieved?: boolean;
}

export interface ListGoalsResponse {
  data: Array<{
    id: string;
    patientId: string;
    patientName: string;
    type: string;
    title: string;
    description: string | null;
    currentValue: number | null;
    targetValue: number;
    unit: string;
    startDate: string;
    targetDate: string;
    achievedAt: string | null;
    progressPercent: number | null;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

export class ListGoalsUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(request: ListGoalsRequest): Promise<ListGoalsResponse> {
    const { data, total } = await this.goalRepository.findAll(request.tenantId, {
      page: request.page,
      limit: request.limit,
      patientId: request.patientId,
      type: request.type,
      achieved: request.achieved,
    });
    const totalPages = Math.ceil(total / request.limit) || 1;
    return {
      data: data.map(({ goal, patientName }) => ({
        id: goal.id,
        patientId: goal.patientId,
        patientName,
        type: goal.type,
        title: goal.title,
        description: goal.description,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        unit: goal.unit,
        startDate: goal.startDate.toISOString(),
        targetDate: goal.targetDate.toISOString(),
        achievedAt: goal.achievedAt?.toISOString() ?? null,
        progressPercent: goal.progressPercent(),
      })),
      meta: {
        page: request.page,
        limit: request.limit,
        total,
        totalPages,
        hasMore: request.page * request.limit < total,
      },
    };
  }
}
