import type { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';

export interface PaginationOpts {
  page: number;
  limit: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
}

export interface TemplateCreateData {
  tenantId: string;
  name: string;
  schemaJson: unknown;
}

export interface TemplateUpdateData {
  name?: string;
  schemaJson?: unknown;
}

export interface ITemplateRepository {
  findAll(tenantId: string, opts: PaginationOpts): Promise<Paginated<AnamnesisTemplate>>;
  findById(id: string, tenantId: string): Promise<AnamnesisTemplate | null>;
  create(data: TemplateCreateData): Promise<AnamnesisTemplate>;
  update(id: string, tenantId: string, data: TemplateUpdateData): Promise<AnamnesisTemplate>;
  delete(id: string, tenantId: string): Promise<void>;
}
