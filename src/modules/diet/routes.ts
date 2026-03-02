import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError, BadRequestError } from '@shared/errors/index.js';
import {
  createDietPlanSchema,
  updateDietPlanSchema,
  listDietPlansQuerySchema,
  createDietEntrySchema,
  updateDietEntrySchema,
  listDietEntriesQuerySchema,
} from './schemas.js';
import { auditLog } from '@shared/utils/audit.js';
import { skipFor } from '@shared/utils/pagination.js';

// XP + nível baseados nas ações do paciente
function computeLevel(xp: number): { level: string; levelLabel: string; nextLevelXp: number } {
  if (xp >= 1000) return { level: 'elite', levelLabel: 'Elite', nextLevelXp: 9999 };
  if (xp >= 500) return { level: 'advanced', levelLabel: 'Avançado', nextLevelXp: 1000 };
  if (xp >= 200) return { level: 'dedicated', levelLabel: 'Dedicado', nextLevelXp: 500 };
  return { level: 'beginner', levelLabel: 'Iniciante', nextLevelXp: 200 };
}

export async function dietRoutes(fastify: FastifyInstance): Promise<void> {
  // ── DIET PLANS ────────────────────────────────────────────────────

  fastify.post(
    '/v1/diet-plans',
    {
      schema: {
        body: {
          type: 'object',
          required: ['patientId', 'name', 'startDate'],
          properties: {
            patientId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            caloriesKcal: { type: 'number', nullable: true },
            proteinG: { type: 'number', nullable: true },
            carbsG: { type: 'number', nullable: true },
            fatG: { type: 'number', nullable: true },
            waterMl: { type: 'number', nullable: true },
            restrictions: { type: 'array', items: { type: 'string' } },
            mealPlanJson: { type: 'object', nullable: true },
            basedOnSessionId: { type: 'string', nullable: true },
            startDate: { type: 'string' },
            endDate: { type: 'string', nullable: true },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createDietPlanSchema.parse(request.body);

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: body.patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');

      const startDate = new Date(body.startDate);
      const endDate = body.endDate ? new Date(body.endDate) : null;
      if (endDate && endDate <= startDate) {
        throw new BadRequestError('Data de término deve ser posterior à data de início');
      }

      const plan = await fastify.prisma.dietPlan.create({
        data: {
          tenantId,
          patientId: body.patientId,
          name: body.name,
          description: body.description ?? null,
          caloriesKcal: body.caloriesKcal ?? null,
          proteinG: body.proteinG ?? null,
          carbsG: body.carbsG ?? null,
          fatG: body.fatG ?? null,
          waterMl: body.waterMl ?? null,
          restrictions: body.restrictions ?? [],
          mealPlanJson: body.mealPlanJson ? (body.mealPlanJson as object) : undefined,
          basedOnSessionId: body.basedOnSessionId ?? null,
          startDate,
          endDate,
          active: body.active ?? true,
        },
      });

      await auditLog(fastify.prisma, tenantId, 'create', 'diet_plan', plan.id, user.userId, {
        patientId: body.patientId,
        name: body.name,
      });

      return reply.status(201).send({
        id: plan.id,
        patientId: plan.patientId,
        name: plan.name,
        startDate: plan.startDate.toISOString(),
      });
    }
  );

  fastify.get(
    '/v1/diet-plans',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            patientId: { type: 'string' },
            active: { type: 'boolean' },
            name: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const query = listDietPlansQuerySchema.parse(request.query);
      const { page = 1, limit = 20 } = query;
      const skip = skipFor(page, limit);

      const where = {
        tenantId,
        deletedAt: null as null,
        ...(query.patientId && { patientId: query.patientId }),
        ...(query.active !== undefined && { active: query.active }),
        ...(query.name && { name: { contains: query.name, mode: 'insensitive' as const } }),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.dietPlan.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startDate: 'desc' },
          include: {
            patient: { select: { id: true, fullName: true } },
            _count: { select: { entries: { where: { deletedAt: null } } } },
          },
        }),
        fastify.prisma.dietPlan.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((p) => ({
          id: p.id,
          patientId: p.patientId,
          patientName: p.patient.fullName,
          name: p.name,
          description: p.description,
          caloriesKcal: p.caloriesKcal,
          proteinG: p.proteinG,
          carbsG: p.carbsG,
          fatG: p.fatG,
          waterMl: p.waterMl,
          restrictions: p.restrictions,
          basedOnSessionId: p.basedOnSessionId,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate?.toISOString() ?? null,
          active: p.active,
          entriesCount: p._count.entries,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: page * limit < total,
        },
      });
    }
  );

  fastify.get(
    '/v1/diet-plans/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const { id } = request.params as { id: string };

      const plan = await fastify.prisma.dietPlan.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: {
          patient: { select: { id: true, fullName: true } },
          _count: { select: { entries: { where: { deletedAt: null } } } },
        },
      });
      if (!plan) throw new NotFoundError('Plano de dieta não encontrado');

      return reply.status(200).send({
        id: plan.id,
        patientId: plan.patientId,
        patientName: plan.patient.fullName,
        name: plan.name,
        description: plan.description,
        caloriesKcal: plan.caloriesKcal,
        proteinG: plan.proteinG,
        carbsG: plan.carbsG,
        fatG: plan.fatG,
        waterMl: plan.waterMl,
        restrictions: plan.restrictions,
        mealPlanJson: plan.mealPlanJson,
        basedOnSessionId: plan.basedOnSessionId,
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate?.toISOString() ?? null,
        active: plan.active,
        entriesCount: plan._count.entries,
      });
    }
  );

  fastify.patch(
    '/v1/diet-plans/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const body = updateDietPlanSchema.parse(request.body);

      const existing = await fastify.prisma.dietPlan.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Plano de dieta não encontrado');

      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description ?? null;
      if (body.caloriesKcal !== undefined) updateData.caloriesKcal = body.caloriesKcal ?? null;
      if (body.proteinG !== undefined) updateData.proteinG = body.proteinG ?? null;
      if (body.carbsG !== undefined) updateData.carbsG = body.carbsG ?? null;
      if (body.fatG !== undefined) updateData.fatG = body.fatG ?? null;
      if (body.waterMl !== undefined) updateData.waterMl = body.waterMl ?? null;
      if (body.restrictions !== undefined) updateData.restrictions = body.restrictions;
      if (body.mealPlanJson !== undefined) updateData.mealPlanJson = body.mealPlanJson ?? null;
      if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
      if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
      if (body.active !== undefined) updateData.active = body.active;

      const plan = await fastify.prisma.dietPlan.update({
        where: { id },
        data: updateData,
      });

      await auditLog(fastify.prisma, tenantId, 'update', 'diet_plan', id, user.userId, {
        changes: Object.keys(updateData),
      });

      return reply.status(200).send({
        id: plan.id,
        name: plan.name,
        active: plan.active,
        endDate: plan.endDate?.toISOString() ?? null,
      });
    }
  );

  fastify.delete(
    '/v1/diet-plans/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };

      const existing = await fastify.prisma.dietPlan.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Plano de dieta não encontrado');

      await fastify.prisma.dietPlan.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await auditLog(fastify.prisma, tenantId, 'delete', 'diet_plan', id, user.userId);
      return reply.status(204).send();
    }
  );

  // ── DIET ENTRIES ──────────────────────────────────────────────────

  fastify.post(
    '/v1/diet-entries',
    {
      schema: {
        body: {
          type: 'object',
          required: ['patientId', 'entryDate', 'mealType', 'foodsJson'],
          properties: {
            patientId: { type: 'string' },
            dietPlanId: { type: 'string', nullable: true },
            entryDate: { type: 'string' },
            mealType: { type: 'string' },
            foodsJson: { type: 'array' },
            totalCalories: { type: 'number', nullable: true },
            totalProteinG: { type: 'number', nullable: true },
            totalCarbsG: { type: 'number', nullable: true },
            totalFatG: { type: 'number', nullable: true },
            waterMl: { type: 'number', nullable: true },
            notes: { type: 'string', nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createDietEntrySchema.parse(request.body);

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: body.patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');

      if (body.dietPlanId) {
        const plan = await fastify.prisma.dietPlan.findFirst({
          where: { id: body.dietPlanId, tenantId, deletedAt: null },
        });
        if (!plan) throw new NotFoundError('Plano de dieta não encontrado');
      }

      // Auto-calcular totais a partir dos alimentos se não fornecidos
      const foods = body.foodsJson;
      const totalCalories =
        body.totalCalories ?? foods.reduce((s, f) => s + (f.caloriesKcal ?? 0), 0);
      const totalProteinG =
        body.totalProteinG ?? foods.reduce((s, f) => s + (f.proteinG ?? 0), 0);
      const totalCarbsG = body.totalCarbsG ?? foods.reduce((s, f) => s + (f.carbsG ?? 0), 0);
      const totalFatG = body.totalFatG ?? foods.reduce((s, f) => s + (f.fatG ?? 0), 0);

      const entry = await fastify.prisma.dietEntry.create({
        data: {
          tenantId,
          patientId: body.patientId,
          dietPlanId: body.dietPlanId ?? null,
          entryDate: new Date(body.entryDate),
          mealType: body.mealType,
          foodsJson: foods as object[],
          totalCalories,
          totalProteinG,
          totalCarbsG,
          totalFatG,
          waterMl: body.waterMl ?? null,
          notes: body.notes ?? null,
        },
      });

      await auditLog(fastify.prisma, tenantId, 'create', 'diet_entry', entry.id, user.userId, {
        patientId: body.patientId,
        mealType: body.mealType,
        entryDate: body.entryDate,
      });

      return reply.status(201).send({
        id: entry.id,
        patientId: entry.patientId,
        mealType: entry.mealType,
        entryDate: entry.entryDate.toISOString(),
        totalCalories: entry.totalCalories,
      });
    }
  );

  fastify.get(
    '/v1/diet-entries',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            patientId: { type: 'string' },
            dietPlanId: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
            mealType: { type: 'string' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const query = listDietEntriesQuerySchema.parse(request.query);
      const { page = 1, limit = 50 } = query;
      const skip = skipFor(page, limit);

      const where = {
        tenantId,
        deletedAt: null as null,
        ...(query.patientId && { patientId: query.patientId }),
        ...(query.dietPlanId && { dietPlanId: query.dietPlanId }),
        ...(query.mealType && { mealType: query.mealType }),
        ...(query.from || query.to
          ? {
              entryDate: {
                ...(query.from && { gte: new Date(query.from) }),
                ...(query.to && { lte: new Date(query.to) }),
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.dietEntry.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
          include: { plan: { select: { id: true, name: true } } },
        }),
        fastify.prisma.dietEntry.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((e) => ({
          id: e.id,
          patientId: e.patientId,
          dietPlanId: e.dietPlanId,
          planName: e.plan?.name ?? null,
          entryDate: e.entryDate.toISOString(),
          mealType: e.mealType,
          foodsJson: e.foodsJson,
          totalCalories: e.totalCalories,
          totalProteinG: e.totalProteinG,
          totalCarbsG: e.totalCarbsG,
          totalFatG: e.totalFatG,
          waterMl: e.waterMl,
          notes: e.notes,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: page * limit < total,
        },
      });
    }
  );

  fastify.patch(
    '/v1/diet-entries/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          properties: {
            entryDate: { type: 'string' },
            mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'] },
            foodsJson: { type: 'array' },
            totalCalories: { type: 'number', nullable: true },
            totalProteinG: { type: 'number', nullable: true },
            totalCarbsG: { type: 'number', nullable: true },
            totalFatG: { type: 'number', nullable: true },
            waterMl: { type: 'number', nullable: true },
            notes: { type: 'string', nullable: true },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              entryDate: { type: 'string' },
              mealType: { type: 'string' },
              totalCalories: { type: 'number', nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const body = updateDietEntrySchema.parse(request.body);

      const existing = await fastify.prisma.dietEntry.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Entrada de dieta não encontrada');

      const data: {
        entryDate?: Date;
        mealType?: string;
        foodsJson?: object;
        totalCalories?: number | null;
        totalProteinG?: number | null;
        totalCarbsG?: number | null;
        totalFatG?: number | null;
        waterMl?: number | null;
        notes?: string | null;
      } = {};
      if (body.entryDate != null) {
        const d = new Date(body.entryDate);
        if (isNaN(d.getTime())) throw new BadRequestError('Data da entrada inválida');
        data.entryDate = d;
      }
      if (body.mealType != null) data.mealType = body.mealType;
      if (body.foodsJson != null) data.foodsJson = body.foodsJson as object;
      if (body.totalCalories !== undefined) data.totalCalories = body.totalCalories;
      if (body.totalProteinG !== undefined) data.totalProteinG = body.totalProteinG;
      if (body.totalCarbsG !== undefined) data.totalCarbsG = body.totalCarbsG;
      if (body.totalFatG !== undefined) data.totalFatG = body.totalFatG;
      if (body.waterMl !== undefined) data.waterMl = body.waterMl;
      if (body.notes !== undefined) data.notes = body.notes;

      const entry = await fastify.prisma.dietEntry.update({
        where: { id },
        data,
      });

      await auditLog(fastify.prisma, tenantId, 'update', 'diet_entry', id, user.userId, {});

      return reply.status(200).send({
        id: entry.id,
        entryDate: entry.entryDate.toISOString(),
        mealType: entry.mealType,
        totalCalories: entry.totalCalories,
        totalProteinG: entry.totalProteinG,
        totalCarbsG: entry.totalCarbsG,
        totalFatG: entry.totalFatG,
        waterMl: entry.waterMl,
        notes: entry.notes,
      });
    }
  );

  fastify.delete(
    '/v1/diet-entries/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };

      const existing = await fastify.prisma.dietEntry.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Entrada de dieta não encontrada');

      await fastify.prisma.dietEntry.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await auditLog(fastify.prisma, tenantId, 'delete', 'diet_entry', id, user.userId);
      return reply.status(204).send();
    }
  );

  // ── DIET STATS (gamificação + composição corporal) ────────────────

  fastify.get(
    '/v1/diet-stats/:patientId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['patientId'],
          properties: { patientId: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const { patientId } = request.params as { patientId: string };

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');

      // Buscar todas as entradas de dieta
      const allEntries = await fastify.prisma.dietEntry.findMany({
        where: { patientId, tenantId, deletedAt: null },
        orderBy: { entryDate: 'desc' },
        select: { entryDate: true, totalCalories: true, totalProteinG: true, totalCarbsG: true, totalFatG: true, waterMl: true },
      });

      // Calcular streak: dias consecutivos com ao menos 1 entrada
      const entryDays = new Set(
        allEntries.map((e) => e.entryDate.toISOString().split('T')[0])
      );
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (entryDays.has(key)) {
          streak++;
        } else if (i > 0) {
          break; // quebrou a sequência
        }
      }

      // XP total: 10 por entrada + bônus de streak
      const streakBonus = streak >= 30 ? 200 : streak >= 7 ? 50 : streak >= 3 ? 15 : 0;
      const xpTotal = allEntries.length * 10 + streakBonus;
      const { level, levelLabel, nextLevelXp } = computeLevel(xpTotal);

      // Badges conquistados
      const badges: string[] = [];
      if (allEntries.length >= 1) badges.push('primeira_refeicao');
      if (streak >= 3) badges.push('3_dias_seguidos');
      if (streak >= 7) badges.push('7_dias_seguidos');
      if (streak >= 30) badges.push('30_dias_seguidos');
      if (allEntries.length >= 50) badges.push('50_refeicoes');
      if (allEntries.length >= 100) badges.push('100_refeicoes');

      // Verificar meta de peso atingida
      const weightGoal = await fastify.prisma.patientGoal.findFirst({
        where: {
          patientId,
          tenantId,
          deletedAt: null,
          type: 'weight_loss',
          achievedAt: { not: null },
        },
      });
      if (weightGoal) badges.push('meta_peso_atingida');

      // Plano ativo para calcular adesão
      const activePlan = await fastify.prisma.dietPlan.findFirst({
        where: { patientId, tenantId, active: true, deletedAt: null },
        orderBy: { startDate: 'desc' },
      });

      // Adesão de macros nos últimos 7 dias
      let macroAdherence = 0;
      if (activePlan && activePlan.caloriesKcal) {
        const last7Days = allEntries.slice(0, 7);
        if (last7Days.length > 0) {
          const avgCalories =
            last7Days.reduce((s, e) => s + (e.totalCalories ?? 0), 0) / last7Days.length;
          macroAdherence = Math.min(100, Math.round((avgCalories / activePlan.caloriesKcal) * 100));
        }
      }

      // Métricas corporais (PatientEvolution) para gráficos
      const evolutions = await fastify.prisma.patientEvolution.findMany({
        where: { patientId, tenantId },
        orderBy: { recordedAt: 'asc' },
        take: 30,
        select: {
          recordedAt: true,
          weightKg: true,
          bodyFatPercent: true,
        },
      });

      const bodyMetrics = evolutions.map((e) => ({
        date: e.recordedAt.toISOString().split('T')[0],
        weightKg: e.weightKg,
        bodyFatPercent: e.bodyFatPercent,
        leanMassKg:
          e.weightKg && e.bodyFatPercent
            ? Math.round(e.weightKg * (1 - e.bodyFatPercent / 100) * 10) / 10
            : null,
      }));

      // Resumo diário (hoje)
      const todayKey = today.toISOString().split('T')[0];
      const todayEntries = allEntries.filter(
        (e) => e.entryDate.toISOString().split('T')[0] === todayKey
      );
      const todaySummary = {
        calories: todayEntries.reduce((s, e) => s + (e.totalCalories ?? 0), 0),
        proteinG: todayEntries.reduce((s, e) => s + (e.totalProteinG ?? 0), 0),
        carbsG: todayEntries.reduce((s, e) => s + (e.totalCarbsG ?? 0), 0),
        fatG: todayEntries.reduce((s, e) => s + (e.totalFatG ?? 0), 0),
        waterMl: todayEntries.reduce((s, e) => s + (e.waterMl ?? 0), 0),
      };

      return reply.status(200).send({
        streak,
        xpTotal,
        level,
        levelLabel,
        nextLevelXp,
        xpProgress: nextLevelXp < 9999 ? Math.round((xpTotal / nextLevelXp) * 100) : 100,
        badges,
        macroAdherence,
        activePlan: activePlan
          ? {
              id: activePlan.id,
              name: activePlan.name,
              caloriesKcal: activePlan.caloriesKcal,
              proteinG: activePlan.proteinG,
              carbsG: activePlan.carbsG,
              fatG: activePlan.fatG,
              waterMl: activePlan.waterMl,
            }
          : null,
        todaySummary,
        bodyMetrics,
        totalEntries: allEntries.length,
      });
    }
  );
}
