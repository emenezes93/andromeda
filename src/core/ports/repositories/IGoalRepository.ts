import type { Goal } from '@domain/entities/Goal.js';

export interface GoalCreateData {
  tenantId: string;
  patientId: string;
  type: string;
  title: string;
  description?: string | null;
  currentValue?: number | null;
  targetValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
}

export interface GoalUpdateData {
  title?: string;
  description?: string | null;
  currentValue?: number | null;
  targetValue?: number;
  targetDate?: Date;
  achievedAt?: Date | null;
}

export interface GoalListOpts {
  page: number;
  limit: number;
  patientId?: string;
  type?: string;
  achieved?: boolean;
}

export interface GoalListEntry {
  goal: Goal;
  patientName: string;
}

export interface PaginatedGoals {
  data: GoalListEntry[];
  total: number;
}


export interface IGoalRepository {
  findAll(tenantId: string, opts: GoalListOpts): Promise<PaginatedGoals>;
  findById(id: string, tenantId: string): Promise<Goal | null>;
  create(data: GoalCreateData): Promise<Goal>;
  update(id: string, tenantId: string, data: GoalUpdateData): Promise<Goal>;
  softDelete(id: string, tenantId: string): Promise<void>;
}
