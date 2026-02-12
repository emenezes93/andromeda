/**
 * Shared types and request context
 */

export type Role = 'owner' | 'admin' | 'practitioner' | 'viewer';

export interface TenantContext {
  tenantId: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  tenantId: string;
}

export interface RequestContext {
  requestId: string;
  tenantId?: string;
  user?: AuthUser;
}

// Template schema types (for engine and AI)
export interface QuestionSchema {
  id: string;
  text: string;
  type: 'text' | 'number' | 'single' | 'multiple';
  options?: string[];
  required: boolean;
  tags?: string[];
  showWhen?: { questionId: string; operator: 'eq' | 'in'; value: string | string[] };
}

export interface ConditionalRule {
  ifQuestion: string;
  ifValue: string | string[];
  thenShow: string[];
}

export interface TemplateSchemaJson {
  questions: QuestionSchema[];
  conditionalLogic?: ConditionalRule[];
  tags?: string[];
}

export interface RisksPayload {
  readiness: number;
  dropoutRisk: number;
  stress: number;
  sleepQuality: number;
}

export interface AiInsightPayload {
  summary: string;
  risks: RisksPayload;
  recommendations: string[];
}
