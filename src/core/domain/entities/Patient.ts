/**
 * Domain Entity: Patient
 */
export class Patient {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly fullName: string,
    public readonly birthDate: Date | null,
    public readonly gender: string | null,
    public readonly cpf: string | null,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly profession: string | null,
    public readonly mainGoal: string | null,
    public readonly mainComplaint: string | null,
    public readonly notes: string | null,
    public readonly consentVersion: string | null,
    public readonly consentAcceptedAt: Date | null,
    public readonly userId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null = null
  ) {}

  static create(data: {
    tenantId: string;
    fullName: string;
    birthDate?: Date | null;
    gender?: string | null;
    cpf?: string | null;
    email?: string | null;
    phone?: string | null;
    profession?: string | null;
    mainGoal?: string | null;
    mainComplaint?: string | null;
    notes?: string | null;
    consentVersion?: string | null;
    consentAcceptedAt?: Date | null;
    userId?: string | null;
  }): Patient {
    const now = new Date();
    return new Patient(
      '',
      data.tenantId,
      data.fullName,
      data.birthDate ?? null,
      data.gender ?? null,
      data.cpf ?? null,
      data.email ?? null,
      data.phone ?? null,
      data.profession ?? null,
      data.mainGoal ?? null,
      data.mainComplaint ?? null,
      data.notes ?? null,
      data.consentVersion ?? null,
      data.consentAcceptedAt ?? null,
      data.userId ?? null,
      now,
      now,
      null
    );
  }

  isAdult(): boolean {
    if (!this.birthDate) return false;
    const today = new Date();
    const age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();
    const dayDiff = today.getDate() - this.birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) return age - 1 >= 18;
    return age >= 18;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
