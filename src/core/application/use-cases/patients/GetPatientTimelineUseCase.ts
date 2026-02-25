import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@shared/errors/index.js';

export type TimelineEventType = 'session' | 'evolution' | 'goal';
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  badgeVariant: BadgeVariant;
  linkTo: string | null;
}

export interface GetPatientTimelineRequest {
  patientId: string;
  tenantId: string;
  limit?: number;
}

export interface GetPatientTimelineResponse {
  patientId: string;
  events: TimelineEvent[];
}

export class GetPatientTimelineUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(request: GetPatientTimelineRequest): Promise<GetPatientTimelineResponse> {
    const { patientId, tenantId, limit = 50 } = request;

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundError('Patient not found');

    const [sessions, evolutions, goals] = await Promise.all([
      this.prisma.anamnesisSession.findMany({
        where: { patientId, tenantId, deletedAt: null },
        include: {
          template: { select: { name: true } },
          aiInsights: { take: 1, orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.patientEvolution.findMany({
        where: { patientId, tenantId },
        orderBy: { recordedAt: 'desc' },
        take: limit,
      }),
      this.prisma.patientGoal.findMany({
        where: { patientId, tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const events: TimelineEvent[] = [];

    for (const s of sessions) {
      const insight = s.aiInsights[0];
      let badge: string | null = null;
      let badgeVariant: BadgeVariant = 'default';
      if (s.status === 'completed') {
        badge = 'Concluída';
        badgeVariant = 'success';
      } else if (s.status === 'in_progress') {
        badge = 'Em andamento';
        badgeVariant = 'primary';
      }
      const risks = insight?.risksJson as Record<string, number> | null | undefined;
      const maxRisk = risks
        ? Math.max(...Object.values(risks).filter((v) => typeof v === 'number'))
        : null;
      let subtitle: string | null = null;
      if (maxRisk !== null) {
        if (maxRisk >= 70) { subtitle = 'Risco alto detectado'; badgeVariant = 'error'; }
        else if (maxRisk >= 40) { subtitle = 'Risco moderado'; badgeVariant = 'warning'; }
        else subtitle = 'Sem alertas';
      }
      events.push({
        id: s.id,
        type: 'session',
        date: s.createdAt.toISOString(),
        title: s.template?.name ?? 'Anamnese',
        subtitle,
        badge,
        badgeVariant,
        linkTo: `/sessions/${s.id}`,
      });
    }

    for (const e of evolutions) {
      const parts: string[] = [];
      if (e.weightKg != null) parts.push(`${e.weightKg} kg`);
      if (e.bodyFatPercent != null) parts.push(`${e.bodyFatPercent}% GC`);
      events.push({
        id: e.id,
        type: 'evolution',
        date: e.recordedAt.toISOString(),
        title: 'Evolução registrada',
        subtitle: parts.length > 0 ? parts.join(' · ') : null,
        badge: null,
        badgeVariant: 'default',
        linkTo: null,
      });
    }

    for (const g of goals) {
      let badge: string | null;
      let badgeVariant: BadgeVariant;
      if (g.achievedAt) { badge = 'Conquistada'; badgeVariant = 'success'; }
      else if (new Date(g.targetDate) < new Date()) { badge = 'Vencida'; badgeVariant = 'error'; }
      else { badge = 'Em andamento'; badgeVariant = 'primary'; }
      events.push({
        id: g.id,
        type: 'goal',
        date: g.createdAt.toISOString(),
        title: g.title,
        subtitle: `Meta: ${g.targetValue} ${g.unit}`,
        badge,
        badgeVariant,
        linkTo: null,
      });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { patientId, events: events.slice(0, limit) };
  }
}
