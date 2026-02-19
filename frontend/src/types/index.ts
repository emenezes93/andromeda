export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  tenantId: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  version: number;
  schemaJson: TemplateSchemaJson;
  createdAt: string;
}

export interface TemplateSchemaJson {
  questions: QuestionSchema[];
  conditionalLogic?: ConditionalRule[];
  tags?: string[];
}

export interface QuestionSchema {
  id: string;
  text: string;
  type: 'text' | 'number' | 'single' | 'multiple';
  options?: string[];
  required: boolean;
  tags?: string[];
  showWhen?: { questionId: string; operator: string; value: unknown };
}

export interface ConditionalRule {
  ifQuestion: string;
  ifValue: string | string[];
  thenShow: string[];
}

export interface TemplateListResponse {
  data: Template[];
  meta: PaginationMeta;
}

/** Cadastro completo do paciente (Medidas & Evolução) */
export interface Patient {
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
  consentVersion?: string | null;
  consentAcceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Registro de medidas e evolução em uma data */
export interface PatientEvolution {
  id: string;
  tenantId: string;
  patientId: string;
  recordedAt: string;
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  waistCm: number | null;
  hipCm: number | null;
  waistHipRatio: number | null;
  bodyFatPercent: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRateBpm: number | null;
  notes: string | null;
  createdAt: string;
}

export interface PatientWithCount extends Patient {
  _count: {
    sessions: number;
    evolutions: number;
  };
}

export interface PatientListResponse {
  data: PatientWithCount[];
  meta: PaginationMeta;
}

export interface CreatePatientBody {
  fullName: string;
  birthDate?: string | null;
  gender?: 'M' | 'F' | 'Other' | 'Prefer not to say' | null;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  profession?: string | null;
  mainGoal?: string | null;
  mainComplaint?: string | null;
  notes?: string | null;
  /** Versão do termo LGPD aceito (ex.: "1.0"); quando enviado, o backend grava consentAcceptedAt */
  consentVersion?: string | null;
}

export interface CreateEvolutionBody {
  recordedAt: string;
  weightKg?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  waistHipRatio?: number | null;
  bodyFatPercent?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  heartRateBpm?: number | null;
  notes?: string | null;
}

export interface TenantMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

export interface TenantMembersResponse {
  data: TenantMember[];
  meta: PaginationMeta;
}

export interface Tenant {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface TenantListResponse {
  data: Tenant[];
  meta: PaginationMeta;
}

export type SessionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  tenantId: string;
  templateId: string;
  subjectId: string | null;
  patientId: string | null;
  status: SessionStatus;
  signatureName?: string | null;
  signatureAgreedAt?: string | null;
  createdAt: string;
  template?: Template;
  patient?: Patient | null;
  answers?: { id: string; answersJson: Record<string, unknown>; createdAt: string }[];
}

export interface SessionListResponse {
  data: Session[];
  meta: PaginationMeta;
}

export interface NextQuestionResponse {
  nextQuestion: QuestionSchema | null;
  reason: string;
  completionPercent: number;
}

export interface AiInsight {
  id: string;
  sessionId: string;
  summary: string | null;
  risksJson: { readiness?: number; dropoutRisk?: number; stress?: number; sleepQuality?: number };
  recommendationsJson: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  actorUserId: string | null;
  entityId?: string | null;
  metadataJson?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditListResponse {
  data: AuditLog[];
  meta: PaginationMeta;
}
