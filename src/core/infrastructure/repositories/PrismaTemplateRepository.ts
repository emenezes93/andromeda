import type { PrismaClient } from '@prisma/client';
import { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';
import type {
  ITemplateRepository,
  PaginationOpts,
  Paginated,
  TemplateCreateData,
  TemplateUpdateData,
} from '@ports/repositories/ITemplateRepository.js';

/**
 * Adapter: Prisma Anamnesis Template Repository Implementation
 */
export class PrismaTemplateRepository implements ITemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(tenantId: string, opts: PaginationOpts): Promise<Paginated<AnamnesisTemplate>> {
    const where = { tenantId, deletedAt: null };
    const [rows, total] = await Promise.all([
      this.prisma.anamnesisTemplate.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.anamnesisTemplate.count({ where }),
    ]);
    return { data: rows.map((r) => this.toDomain(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<AnamnesisTemplate | null> {
    const row = await this.prisma.anamnesisTemplate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async create(data: TemplateCreateData): Promise<AnamnesisTemplate> {
    const created = await this.prisma.anamnesisTemplate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        schemaJson: data.schemaJson as object,
      },
    });
    return this.toDomain(created);
  }

  async update(id: string, _tenantId: string, data: TemplateUpdateData): Promise<AnamnesisTemplate> {
    const updated = await this.prisma.anamnesisTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.schemaJson !== undefined && { schemaJson: data.schemaJson as object }),
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.anamnesisTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    name: string;
    version: number;
    schemaJson: unknown;
    llmPrompt: string | null;
    llmFinetunedModel: string | null;
    createdAt: Date;
    deletedAt: Date | null;
  }): AnamnesisTemplate {
    return new AnamnesisTemplate(
      row.id,
      row.tenantId,
      row.name,
      row.version,
      row.schemaJson,
      row.llmPrompt,
      row.llmFinetunedModel,
      row.createdAt,
      row.deletedAt
    );
  }
}
