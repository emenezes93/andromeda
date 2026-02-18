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

export interface Session {
  id: string;
  tenantId: string;
  templateId: string;
  subjectId: string | null;
  createdAt: string;
  template?: Template;
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
