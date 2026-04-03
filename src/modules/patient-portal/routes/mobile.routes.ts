import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { UnauthorizedError, BadRequestError } from '@shared/errors/index.js';
import {
  weightLogSchema,
  waterLogSchema,
  mealLogSchema,
  bodyMeasurementSchema,
  progressPhotoSchema,
  pushTokenSchema,
  healthMetricsSchema,
} from '../schemas.js';
import { auditLog } from '@shared/utils/audit.js';
import { saveProgressPhotoFile } from '../../progress-photos/storageService.js';
import { parseDataUriImage, toDateOnly } from '../route-common.js';

export async function registerPatientPortalMobileRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/patient-portal/my-weight-logs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['date', 'valueKg'],
          properties: {
            date: { type: 'string' },
            valueKg: { type: 'number' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = weightLogSchema.parse(request.body);
      const recordedAt = toDateOnly(body.date);
      const dayStart = new Date(recordedAt);
      const dayEnd = new Date(recordedAt);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const existing = await fastify.prisma.patientEvolution.findFirst({
        where: {
          tenantId,
          patientId,
          recordedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      let id: string;
      if (existing) {
        await fastify.prisma.patientEvolution.update({
          where: { id: existing.id },
          data: { weightKg: body.valueKg },
        });
        id = existing.id;
      } else {
        const evolution = await fastify.prisma.patientEvolution.create({
          data: {
            tenantId,
            patientId,
            weightKg: body.valueKg,
            recordedAt,
          },
        });
        id = evolution.id;
      }

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'patient_evolution',
        id,
        user.userId,
        { patientId, weightKg: body.valueKg, date: body.date }
      );

      return reply.status(201).send({ id });
    }
  );

  fastify.post(
    '/v1/patient-portal/my-water-logs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['date', 'ml'],
          properties: {
            date: { type: 'string' },
            ml: { type: 'number' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = waterLogSchema.parse(request.body);
      const entryDate = toDateOnly(body.date);

      const activePlan = await fastify.prisma.dietPlan.findFirst({
        where: { tenantId, patientId, active: true, deletedAt: null },
        select: { id: true },
      });

      const entry = await fastify.prisma.dietEntry.create({
        data: {
          tenantId,
          patientId,
          dietPlanId: activePlan?.id ?? null,
          entryDate,
          mealType: 'water',
          waterMl: body.ml,
          foodsJson: [],
          totalCalories: 0,
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'diet_entry',
        entry.id,
        user.userId,
        { patientId, waterMl: body.ml, date: body.date }
      );

      return reply.status(201).send({ id: entry.id });
    }
  );

  fastify.post(
    '/v1/patient-portal/my-meal-logs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['date', 'name'],
          properties: {
            date: { type: 'string' },
            time: { type: 'string', nullable: true },
            name: { type: 'string' },
            kcal: { type: 'number', nullable: true },
            proteinG: { type: 'number', nullable: true },
            carbsG: { type: 'number', nullable: true },
            fatG: { type: 'number', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = mealLogSchema.parse(request.body);
      const entryDate = toDateOnly(body.date);

      let mealType = 'other';
      if (body.time) {
        const hours = parseInt(body.time.split(':')[0], 10);
        if (!isNaN(hours)) {
          if (hours < 10) mealType = 'breakfast';
          else if (hours < 15) mealType = 'lunch';
          else if (hours < 21) mealType = 'dinner';
          else mealType = 'snack';
        }
      }

      const activePlan = await fastify.prisma.dietPlan.findFirst({
        where: { tenantId, patientId, active: true, deletedAt: null },
        select: { id: true },
      });

      const entry = await fastify.prisma.dietEntry.create({
        data: {
          tenantId,
          patientId,
          dietPlanId: activePlan?.id ?? null,
          entryDate,
          mealType,
          foodsJson: [
            {
              name: body.name,
              caloriesKcal: body.kcal,
              proteinG: body.proteinG,
              carbsG: body.carbsG,
              fatG: body.fatG,
            },
          ],
          totalCalories: body.kcal ?? 0,
          totalProteinG: body.proteinG ?? 0,
          totalCarbsG: body.carbsG ?? 0,
          totalFatG: body.fatG ?? 0,
        },
      });

      const allEntries = await fastify.prisma.dietEntry.findMany({
        where: { tenantId, patientId, deletedAt: null, mealType: { not: 'water' } },
        orderBy: { entryDate: 'desc' },
        select: { entryDate: true },
      });
      const entryDays = new Set(allEntries.map((e) => e.entryDate.toISOString().split('T')[0]));
      let streak = 0;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        const key = d.toISOString().split('T')[0];
        if (entryDays.has(key)) streak++;
        else if (i > 0) break;
      }
      const streakBonus = streak >= 30 ? 200 : streak >= 7 ? 50 : streak >= 3 ? 15 : 0;
      const xpTotal = allEntries.length * 10 + streakBonus;

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'diet_entry',
        entry.id,
        user.userId,
        { patientId, mealType, name: body.name, date: body.date, streak, xpTotal }
      );

      return reply.status(201).send({ id: entry.id });
    }
  );

  fastify.post(
    '/v1/patient-portal/my-body-measurements',
    {
      schema: {
        body: {
          type: 'object',
          required: ['date'],
          properties: {
            date: { type: 'string' },
            waistCm: { type: 'number', nullable: true },
            hipCm: { type: 'number', nullable: true },
            chestCm: { type: 'number', nullable: true },
            armLeftCm: { type: 'number', nullable: true },
            armRightCm: { type: 'number', nullable: true },
            thighLeftCm: { type: 'number', nullable: true },
            thighRightCm: { type: 'number', nullable: true },
            neckCm: { type: 'number', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = bodyMeasurementSchema.parse(request.body);

      const extraMeasurements: Record<string, number> = {};
      if (body.chestCm != null) extraMeasurements.chestCm = body.chestCm;
      if (body.armLeftCm != null) extraMeasurements.armLeftCm = body.armLeftCm;
      if (body.armRightCm != null) extraMeasurements.armRightCm = body.armRightCm;
      if (body.thighLeftCm != null) extraMeasurements.thighLeftCm = body.thighLeftCm;
      if (body.thighRightCm != null) extraMeasurements.thighRightCm = body.thighRightCm;
      if (body.neckCm != null) extraMeasurements.neckCm = body.neckCm;

      const notes =
        Object.keys(extraMeasurements).length > 0
          ? JSON.stringify(extraMeasurements)
          : null;

      const waistHipRatio =
        body.waistCm != null && body.hipCm != null
          ? body.waistCm / body.hipCm
          : null;

      const evolution = await fastify.prisma.patientEvolution.create({
        data: {
          tenantId,
          patientId,
          recordedAt: toDateOnly(body.date),
          waistCm: body.waistCm ?? null,
          hipCm: body.hipCm ?? null,
          waistHipRatio,
          notes,
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'patient_evolution',
        evolution.id,
        user.userId,
        { patientId, date: body.date }
      );

      return reply.status(201).send({ id: evolution.id });
    }
  );

  fastify.post(
    '/v1/patient-portal/my-progress-photos',
    {
      schema: {
        consumes: ['application/json', 'multipart/form-data'],
        body: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            angle: { type: 'string', nullable: true },
            uri: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const isMultipart =
        (request as typeof request & { isMultipart?: () => boolean }).isMultipart?.() === true;
      if (isMultipart) {
        let date = '';
        let angle: string | null = null;
        const parts = request.parts();
        let fileBuffer: Buffer | null = null;
        let mimeType = 'image/jpeg';

        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === 'file') {
            fileBuffer = await part.toBuffer();
            mimeType = part.mimetype || mimeType;
            continue;
          }
          if (part.type === 'field') {
            if (part.fieldname === 'date') date = String(part.value ?? '');
            if (part.fieldname === 'angle') angle = String(part.value ?? '');
          }
        }

        if (!date) throw new BadRequestError('Data obrigatória');
        if (!fileBuffer) throw new BadRequestError('Arquivo obrigatório');

        const photo = await fastify.prisma.progressPhoto.create({
          data: {
            tenantId,
            patientId,
            takenAt: toDateOnly(date),
            imageUrl: '',
            notes: angle ?? null,
          },
        });

        const ext = await saveProgressPhotoFile(
          tenantId,
          photo.id,
          fileBuffer,
          mimeType
        );
        const imageUrl = `/v1/progress-photos/${photo.id}/file`;
        const uploadType = 'multipart' as const;

        await fastify.prisma.progressPhoto.update({
          where: { id: photo.id },
          data: {
            imageUrl,
            fileExtension: ext,
          },
        });

        await auditLog(
          fastify.prisma,
          tenantId,
          'create',
          'progress_photo',
          photo.id,
          user.userId,
          { patientId, date, uploadType }
        );

        return reply.status(201).send({ id: photo.id });
      }

      const body = progressPhotoSchema.parse(request.body);
      const parsedDataUri = parseDataUriImage(body.uri);
      let imageUrl = body.uri;
      let fileExtension: string | null = null;
      let uploadType: 'url' | 'base64' = 'url';

      const photo = await fastify.prisma.progressPhoto.create({
        data: {
          tenantId,
          patientId,
          takenAt: toDateOnly(body.date),
          imageUrl: '',
          notes: body.angle ?? null,
        },
      });

      if (parsedDataUri) {
        const ext = await saveProgressPhotoFile(
          tenantId,
          photo.id,
          parsedDataUri.buffer,
          parsedDataUri.mimeType
        );
        imageUrl = `/v1/progress-photos/${photo.id}/file`;
        fileExtension = ext;
        uploadType = 'base64';
      }

      await fastify.prisma.progressPhoto.update({
        where: { id: photo.id },
        data: {
          imageUrl,
          fileExtension,
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'progress_photo',
        photo.id,
        user.userId,
        { patientId, date: body.date, uploadType }
      );

      return reply.status(201).send({ id: photo.id });
    }
  );

  fastify.post(
    '/v1/patient-portal/my-health-metrics',
    {
      schema: {
        body: {
          type: 'object',
          required: ['provider', 'date'],
          properties: {
            provider: { type: 'string' },
            date: { type: 'string' },
            steps: { type: 'number', nullable: true },
            activeMinutes: { type: 'number', nullable: true },
            sleepMinutes: { type: 'number', nullable: true },
            source: { type: 'string', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = healthMetricsSchema.parse(request.body);
      const evolution = await fastify.prisma.patientEvolution.create({
        data: {
          tenantId,
          patientId,
          recordedAt: toDateOnly(body.date),
          notes: JSON.stringify({
            type: 'health_metrics',
            provider: body.provider,
            source: body.source ?? null,
            steps: body.steps ?? null,
            activeMinutes: body.activeMinutes ?? null,
            sleepMinutes: body.sleepMinutes ?? null,
          }),
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'patient_evolution',
        evolution.id,
        user.userId,
        { patientId, date: body.date, provider: body.provider, source: body.source ?? null }
      );

      return reply.status(201).send({ id: evolution.id });
    }
  );

  fastify.post(
    '/v1/patient-portal/me/push-token',
    {
      schema: {
        body: {
          type: 'object',
          required: ['token', 'platform'],
          properties: {
            token: { type: 'string' },
            platform: { type: 'string', enum: ['ios', 'android'] },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = pushTokenSchema.parse(request.body);

      await fastify.prisma.patient.update({
        where: { id: patientId },
        data: {
          pushToken: body.token,
          pushPlatform: body.platform,
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'push_token_registered',
        'patient',
        patientId,
        user.userId,
        { token: body.token, platform: body.platform }
      );

      return reply.status(201).send({ id: patientId });
    }
  );
}
