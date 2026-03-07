import type { PrismaClient } from '@prisma/client';
import type { CreateExerciseBody, UpdateExerciseBody, ListExercisesQuery } from './schemas.js';

export async function listExercises(
  prisma: PrismaClient,
  tenantId: string,
  query: ListExercisesQuery
) {
  const { page = 1, limit = 20, muscleGroup, search } = query;
  const skip = (page - 1) * limit;

  const where = {
    OR: [{ isGlobal: true }, { tenantId }],
    ...(muscleGroup && { muscleGroup }),
    ...(search && search.trim() && { name: { contains: search.trim(), mode: 'insensitive' as const } }),
  };

  const [data, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ name: 'asc' }],
    }),
    prisma.exercise.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page * limit < total,
    },
  };
}

export async function getExerciseById(
  prisma: PrismaClient,
  id: string,
  tenantId: string
) {
  const exercise = await prisma.exercise.findFirst({
    where: {
      id,
      OR: [{ isGlobal: true }, { tenantId }],
    },
  });
  return exercise;
}

export async function createExercise(
  prisma: PrismaClient,
  tenantId: string,
  body: CreateExerciseBody
) {
  return prisma.exercise.create({
    data: {
      tenantId,
      name: body.name.trim(),
      muscleGroup: body.muscleGroup,
      equipment: body.equipment || null,
      videoUrl: body.videoUrl && body.videoUrl !== '' ? body.videoUrl : null,
      isGlobal: false,
    },
  });
}

export async function updateExercise(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  body: UpdateExerciseBody
) {
  const existing = await prisma.exercise.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return null;
  if (existing.isGlobal) return null;

  return prisma.exercise.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.muscleGroup !== undefined && { muscleGroup: body.muscleGroup }),
      ...(body.equipment !== undefined && { equipment: body.equipment || null }),
      ...(body.videoUrl !== undefined && {
        videoUrl: body.videoUrl && body.videoUrl !== '' ? body.videoUrl : null,
      }),
    },
  });
}

export async function deleteExercise(
  prisma: PrismaClient,
  id: string,
  tenantId: string
) {
  const existing = await prisma.exercise.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return false;
  if (existing.isGlobal) return false;

  await prisma.exercise.delete({ where: { id } });
  return true;
}
