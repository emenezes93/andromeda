import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';

export async function adherenceRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /v1/stats/adherence-overview
  fastify.get(
    '/v1/stats/adherence-overview',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    patientId: { type: 'string' },
                    fullName: { type: 'string' },
                    trainingAdherence7d: { type: 'number' },
                    dietStreak: { type: 'number' },
                    lastTrainingAt: { type: 'string', nullable: true },
                    lastSessionAt: { type: 'string', nullable: true },
                    unreadAlerts: { type: 'number' },
                    mainGoal: { type: 'string', nullable: true },
                    mainGoalStatus: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);

      // Get all active patients for this tenant
      const patients = await fastify.prisma.patient.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, fullName: true, mainGoal: true },
        orderBy: { fullName: 'asc' },
      });

      if (patients.length === 0) {
        return reply.status(200).send({ data: [] });
      }

      const patientIds = patients.map((p) => p.id);
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Batch queries to avoid N+1
      const [trainingExecutions, dietEntries, alerts, sessions, lastTrainings, goals] = await Promise.all([
        // Training executions in last 7 days
        fastify.prisma.trainingExecution.findMany({
          where: {
            tenantId,
            patientId: { in: patientIds },
            executedAt: { gte: sevenDaysAgo },
            deletedAt: null,
            completed: true,
          },
          select: { patientId: true, executedAt: true },
        }),
        // Diet entries in last 7 days (for streak-like metric)
        fastify.prisma.dietEntry.findMany({
          where: {
            tenantId,
            patientId: { in: patientIds },
            entryDate: { gte: sevenDaysAgo },
            deletedAt: null,
            mealType: { not: 'water' },
          },
          select: { patientId: true, entryDate: true },
        }),
        // Unread alerts
        fastify.prisma.alert.groupBy({
          by: ['patientId'],
          where: { tenantId, patientId: { in: patientIds }, readAt: null },
          _count: true,
        }),
        // Last session per patient
        fastify.prisma.anamnesisSession.findMany({
          where: {
            tenantId,
            patientId: { in: patientIds },
            deletedAt: null,
            status: 'completed',
          },
          orderBy: { createdAt: 'desc' },
          select: { patientId: true, createdAt: true },
          distinct: ['patientId'],
        }),
        // Last training execution per patient (all-time)
        fastify.prisma.trainingExecution.findMany({
          where: {
            tenantId,
            patientId: { in: patientIds },
            deletedAt: null,
            completed: true,
          },
          orderBy: { executedAt: 'desc' },
          select: { patientId: true, executedAt: true },
          distinct: ['patientId'],
        }),
        // Goal status source for each patient
        fastify.prisma.patientGoal.findMany({
          where: {
            tenantId,
            patientId: { in: patientIds },
            deletedAt: null,
          },
          orderBy: [{ achievedAt: 'desc' }, { targetDate: 'asc' }],
          select: {
            patientId: true,
            achievedAt: true,
            currentValue: true,
            targetValue: true,
            targetDate: true,
          },
        }),
      ]);

      // Index data by patientId
      const trainingByPatient = new Map<string, Date[]>();
      for (const exec of trainingExecutions) {
        const list = trainingByPatient.get(exec.patientId) ?? [];
        list.push(exec.executedAt);
        trainingByPatient.set(exec.patientId, list);
      }

      const dietDaysByPatient = new Map<string, Set<string>>();
      for (const entry of dietEntries) {
        const set = dietDaysByPatient.get(entry.patientId) ?? new Set<string>();
        set.add(entry.entryDate.toISOString().split('T')[0]);
        dietDaysByPatient.set(entry.patientId, set);
      }

      const alertsByPatient = new Map<string, number>();
      for (const alert of alerts) {
        alertsByPatient.set(alert.patientId, alert._count);
      }

      const lastSessionByPatient = new Map<string, Date>();
      for (const sess of sessions) {
        if (sess.patientId && !lastSessionByPatient.has(sess.patientId)) {
          lastSessionByPatient.set(sess.patientId, sess.createdAt);
        }
      }

      const lastTrainingByPatient = new Map<string, Date>();
      for (const exec of lastTrainings) {
        if (!lastTrainingByPatient.has(exec.patientId)) {
          lastTrainingByPatient.set(exec.patientId, exec.executedAt);
        }
      }

      const mainGoalStatusByPatient = new Map<string, string>();
      for (const goal of goals) {
        if (mainGoalStatusByPatient.has(goal.patientId)) continue;
        if (goal.achievedAt) {
          mainGoalStatusByPatient.set(goal.patientId, 'achieved');
          continue;
        }
        const msToTarget = goal.targetDate.getTime() - now.getTime();
        const daysToTarget = Math.floor(msToTarget / (1000 * 60 * 60 * 24));
        if (daysToTarget < 0) {
          mainGoalStatusByPatient.set(goal.patientId, 'overdue');
          continue;
        }
        if (goal.currentValue != null && goal.targetValue > 0) {
          const progressRatio = Math.min(1, Math.abs(goal.currentValue) / Math.abs(goal.targetValue));
          if (progressRatio >= 0.7) {
            mainGoalStatusByPatient.set(goal.patientId, 'on_track');
            continue;
          }
        }
        mainGoalStatusByPatient.set(goal.patientId, daysToTarget <= 14 ? 'at_risk' : 'in_progress');
      }

      const data = patients.map((patient) => {
        const trainingDates = trainingByPatient.get(patient.id) ?? [];
        // Adherence: unique days with training / 7 * 100
        const uniqueTrainingDays = new Set(
          trainingDates.map((d) => d.toISOString().split('T')[0])
        );
        const trainingAdherence7d = Math.round((uniqueTrainingDays.size / 7) * 100);

        const dietDays = dietDaysByPatient.get(patient.id) ?? new Set<string>();
        // Streak: count consecutive days back from today
        let dietStreak = 0;
        const checkDate = new Date(now);
        for (let i = 0; i < 90; i++) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (dietDays.has(dateStr)) {
            dietStreak++;
          } else if (i > 0) {
            break; // streak broken (skip today if no entry yet)
          }
          checkDate.setDate(checkDate.getDate() - 1);
        }

        const lastTraining = lastTrainingByPatient.get(patient.id) ?? null;

        const lastSession = lastSessionByPatient.get(patient.id) ?? null;

        return {
          patientId: patient.id,
          fullName: patient.fullName,
          trainingAdherence7d,
          dietStreak,
          lastTrainingAt: lastTraining?.toISOString() ?? null,
          lastSessionAt: lastSession?.toISOString() ?? null,
          unreadAlerts: alertsByPatient.get(patient.id) ?? 0,
          mainGoal: patient.mainGoal ?? null,
          mainGoalStatus: mainGoalStatusByPatient.get(patient.id) ?? null,
        };
      });

      return reply.status(200).send({ data });
    }
  );
}
