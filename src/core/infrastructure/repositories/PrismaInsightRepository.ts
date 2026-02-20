import type { PrismaClient } from '@prisma/client';
import { Insight } from '@domain/entities/Insight.js';
import type {
  IInsightRepository,
  InsightCreateData,
} from '@ports/repositories/IInsightRepository.js';

export class PrismaInsightRepository implements IInsightRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySessionId(sessionId: string, tenantId: string): Promise<Insight | null> {
    const row = await this.prisma.aiInsight.findFirst({
      where: { sessionId, tenantId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByAnswersHash(tenantId: string, answersHash: string): Promise<Insight | null> {
    const row = await this.prisma.aiInsight.findFirst({
      where: { tenantId, answersHash },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: InsightCreateData): Promise<Insight> {
    const created = await this.prisma.aiInsight.create({
      data: {
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        summary: data.summary,
        risksJson: data.risksJson as object,
        recommendationsJson: data.recommendationsJson,
        answersHash: data.answersHash ?? undefined,
      },
    });
    return this.toDomain(created);
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    sessionId: string;
    summary: string | null;
    risksJson: unknown;
    recommendationsJson: unknown;
    answersHash: string | null;
    createdAt: Date;
  }): Insight {
    const risks = (row.risksJson && typeof row.risksJson === 'object'
      ? row.risksJson as Record<string, number>
      : {}) as { readiness: number; dropoutRisk: number; stress: number; sleepQuality: number };
    const recs = Array.isArray(row.recommendationsJson)
      ? (row.recommendationsJson as string[])
      : [];
    return new Insight(
      row.id,
      row.tenantId,
      row.sessionId,
      row.summary ?? '',
      {
        readiness: Number(risks.readiness) || 50,
        dropoutRisk: Number(risks.dropoutRisk) || 30,
        stress: Number(risks.stress) || 50,
        sleepQuality: Number(risks.sleepQuality) || 50,
      },
      recs,
      row.answersHash,
      row.createdAt
    );
  }
}
