import type { PrismaClient } from '@prisma/client';
import { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import type {
  ISessionRepository,
  SessionCreateData,
  SessionListOpts,
  SessionListEntry,
} from '@ports/repositories/ISessionRepository.js';
import type { Paginated } from '@ports/repositories/ITemplateRepository.js';

export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(
    tenantId: string,
    opts: SessionListOpts
  ): Promise<Paginated<SessionListEntry>> {
    const where: {
      tenantId: string;
      deletedAt: null;
      status?: string;
      templateId?: string;
      patientId?: string | null;
    } = { tenantId, deletedAt: null };
    if (opts.status) where.status = opts.status;
    if (opts.templateId) where.templateId = opts.templateId;
    if (opts.patientId) where.patientId = opts.patientId;

    const [rows, total] = await Promise.all([
      this.prisma.anamnesisSession.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: { select: { id: true, name: true } },
          patient: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.anamnesisSession.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        templateId: r.templateId,
        subjectId: r.subjectId,
        patientId: r.patientId,
        status: r.status,
        fillToken: r.fillToken,
        signatureName: r.signatureName,
        signatureAgreedAt: r.signatureAgreedAt,
        createdAt: r.createdAt,
        template: { id: r.template.id, name: r.template.name },
        patient: r.patient ? { id: r.patient.id, fullName: r.patient.fullName } : null,
      })),
      total,
    };
  }

  async findById(
    id: string,
    tenantId: string,
    options?: { includeLatestAnswers?: boolean }
  ): Promise<AnamnesisSession | null> {
    const session = await this.prisma.anamnesisSession.findFirst({
      where: { id, tenantId, deletedAt: null },
      include:
        options?.includeLatestAnswers
          ? {
              answers: { orderBy: { createdAt: 'desc' }, take: 1, select: { answersJson: true } },
            }
          : undefined,
    });
    if (!session) return null;
    const sessionWithAnswers = session as typeof session & {
      answers?: Array<{ answersJson: unknown }>;
    };
    const answersJson =
      options?.includeLatestAnswers && sessionWithAnswers.answers?.[0]?.answersJson
        ? (sessionWithAnswers.answers[0].answersJson as Record<string, unknown>)
        : {};
    return this.toDomain(session, answersJson);
  }

  async findByPublicToken(token: string): Promise<AnamnesisSession | null> {
    const session = await this.prisma.anamnesisSession.findFirst({
      where: { fillToken: token, deletedAt: null },
      include: {
        answers: { orderBy: { createdAt: 'desc' }, take: 1, select: { answersJson: true } },
      },
    });
    if (!session) return null;
    const sessionWithAnswers = session as typeof session & {
      answers?: Array<{ answersJson: unknown }>;
    };
    const answersJson =
      sessionWithAnswers.answers?.[0]?.answersJson &&
      typeof sessionWithAnswers.answers[0].answersJson === 'object'
        ? (sessionWithAnswers.answers[0].answersJson as Record<string, unknown>)
        : {};
    return this.toDomain(session, answersJson);
  }

  async create(data: SessionCreateData): Promise<AnamnesisSession> {
    const created = await this.prisma.anamnesisSession.create({
      data: {
        tenantId: data.tenantId,
        templateId: data.templateId,
        subjectId: data.subjectId ?? undefined,
        patientId: data.patientId ?? undefined,
      },
    });
    return this.toDomain(created);
  }

  async addAnswers(
    sessionId: string,
    tenantId: string,
    answersJson: Record<string, unknown>
  ): Promise<{ id: string; sessionId: string; answersJson: Record<string, unknown>; createdAt: Date }> {
    const created = await this.prisma.anamnesisAnswer.create({
      data: {
        tenantId,
        sessionId,
        answersJson: answersJson as object,
      },
    });
    return {
      id: created.id,
      sessionId: created.sessionId,
      answersJson: (created.answersJson as Record<string, unknown>) ?? {},
      createdAt: created.createdAt,
    };
  }

  async addAnswersAndComplete(
    sessionId: string,
    tenantId: string,
    answersJson: Record<string, unknown>
  ): Promise<{ id: string; sessionId: string; answersJson: Record<string, unknown>; createdAt: Date }> {
    const [answer] = await this.prisma.$transaction([
      this.prisma.anamnesisAnswer.create({
        data: { tenantId, sessionId, answersJson: answersJson as object },
      }),
      this.prisma.anamnesisSession.update({
        where: { id: sessionId },
        data: { status: 'completed' },
      }),
    ]);
    return {
      id: answer.id,
      sessionId: answer.sessionId,
      answersJson: (answer.answersJson as Record<string, unknown>) ?? {},
      createdAt: answer.createdAt,
    };
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: AnamnesisSession['status']
  ): Promise<AnamnesisSession> {
    const existing = await this.prisma.anamnesisSession.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error('Session not found');
    const updated = await this.prisma.anamnesisSession.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(updated);
  }

  async updateSignature(
    id: string,
    tenantId: string,
    signatureName: string,
    signatureAgreedAt: Date
  ): Promise<AnamnesisSession> {
    const existing = await this.prisma.anamnesisSession.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error('Session not found');
    const updated = await this.prisma.anamnesisSession.update({
      where: { id },
      data: { signatureName, signatureAgreedAt, status: 'completed' },
    });
    return this.toDomain(updated);
  }

  async setFillToken(id: string, tenantId: string, fillToken: string): Promise<AnamnesisSession> {
    const existing = await this.prisma.anamnesisSession.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error('Session not found');
    const updated = await this.prisma.anamnesisSession.update({
      where: { id },
      data: { fillToken },
    });
    return this.toDomain(updated);
  }

  private toDomain(
    row: {
      id: string;
      tenantId: string;
      templateId: string;
      subjectId: string | null;
      patientId: string | null;
      status: string;
      fillToken: string | null;
      signatureName: string | null;
      signatureAgreedAt: Date | null;
      createdAt: Date;
      deletedAt: Date | null;
    },
    currentAnswersJson: Record<string, unknown> = {}
  ): AnamnesisSession {
    return new AnamnesisSession(
      row.id,
      row.tenantId,
      row.templateId,
      row.subjectId,
      row.patientId,
      row.status as AnamnesisSession['status'],
      row.fillToken,
      row.signatureName,
      row.signatureAgreedAt,
      row.createdAt,
      row.deletedAt,
      currentAnswersJson
    );
  }
}
