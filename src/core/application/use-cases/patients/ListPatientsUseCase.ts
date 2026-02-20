import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';

export interface ListPatientsRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface ListPatientsResponse {
  data: Array<{
    id: string;
    tenantId: string;
    fullName: string;
    birthDate: string | null;
    gender: string | null;
    cpf: string | null;
    email: string | null;
    phone: string | null;
    profession: string | null;
    mainGoal: string | null;
    mainComplaint: string | null;
    notes: string | null;
    consentVersion: string | null;
    consentAcceptedAt: string | null;
    userId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

export class ListPatientsUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(request: ListPatientsRequest): Promise<ListPatientsResponse> {
    const { data, total } = await this.patientRepository.findAll(request.tenantId, {
      page: request.page,
      limit: request.limit,
      search: request.search,
    });
    const totalPages = Math.ceil(total / request.limit) || 1;
    return {
      data: data.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        fullName: p.fullName,
        birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : null,
        gender: p.gender,
        cpf: p.cpf,
        email: p.email,
        phone: p.phone,
        profession: p.profession,
        mainGoal: p.mainGoal,
        mainComplaint: p.mainComplaint,
        notes: p.notes,
        consentVersion: p.consentVersion,
        consentAcceptedAt: p.consentAcceptedAt ? p.consentAcceptedAt.toISOString() : null,
        userId: p.userId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      meta: {
        page: request.page,
        limit: request.limit,
        total,
        totalPages,
        hasMore: request.page * request.limit < total,
      },
    };
  }
}
