import type { PrismaClient } from '@prisma/client';
import { Patient } from '@domain/entities/Patient.js';
import type {
  IPatientRepository,
  PatientCreateData,
  PatientUpdateData,
} from '@ports/repositories/IPatientRepository.js';

/**
 * Adapter: Prisma Patient Repository Implementation
 */
export class PrismaPatientRepository implements IPatientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(
    tenantId: string,
    opts: { page: number; limit: number; search?: string }
  ): Promise<{ data: Patient[]; total: number }> {
    const where = {
      tenantId,
      deletedAt: null,
      ...(opts.search
        ? { fullName: { contains: opts.search, mode: 'insensitive' as const } }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.patient.count({ where }),
    ]);
    return { data: rows.map((r) => this.toDomain(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<Patient | null> {
    const row = await this.prisma.patient.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByCpf(cpf: string, tenantId: string): Promise<Patient | null> {
    const row = await this.prisma.patient.findFirst({
      where: { cpf, tenantId, deletedAt: null },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async create(data: PatientCreateData): Promise<Patient> {
    const created = await this.prisma.patient.create({
      data: {
        tenantId: data.tenantId,
        fullName: data.fullName,
        birthDate: data.birthDate ?? undefined,
        gender: data.gender ?? undefined,
        cpf: data.cpf ?? undefined,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        profession: data.profession ?? undefined,
        mainGoal: data.mainGoal ?? undefined,
        mainComplaint: data.mainComplaint ?? undefined,
        notes: data.notes ?? undefined,
        consentVersion: data.consentVersion ?? undefined,
        consentAcceptedAt: data.consentAcceptedAt ?? undefined,
        userId: data.userId ?? undefined,
      },
    });
    return this.toDomain(created);
  }

  async update(id: string, _tenantId: string, data: PatientUpdateData): Promise<Patient> {
    const updated = await this.prisma.patient.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.cpf !== undefined && { cpf: data.cpf }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.profession !== undefined && { profession: data.profession }),
        ...(data.mainGoal !== undefined && { mainGoal: data.mainGoal }),
        ...(data.mainComplaint !== undefined && { mainComplaint: data.mainComplaint }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.consentVersion !== undefined && { consentVersion: data.consentVersion }),
        ...(data.consentAcceptedAt !== undefined && { consentAcceptedAt: data.consentAcceptedAt }),
        ...(data.userId !== undefined && { userId: data.userId }),
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    fullName: string;
    birthDate: Date | null;
    gender: string | null;
    cpf: string | null;
    email: string | null;
    phone: string | null;
    profession: string | null;
    mainGoal: string | null;
    mainComplaint: string | null;
    notes: string | null;
    consentVersion: string | null;
    consentAcceptedAt: Date | null;
    userId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Patient {
    return new Patient(
      row.id,
      row.tenantId,
      row.fullName,
      row.birthDate,
      row.gender,
      row.cpf,
      row.email,
      row.phone,
      row.profession,
      row.mainGoal,
      row.mainComplaint,
      row.notes,
      row.consentVersion,
      row.consentAcceptedAt,
      row.userId,
      row.createdAt,
      row.updatedAt,
      row.deletedAt
    );
  }
}
