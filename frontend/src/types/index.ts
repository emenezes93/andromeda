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

export interface LoginRequiresTwoFactor {
  requiresTwoFactor: true;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
}

export interface TwoFactorSetupStartResponse {
  qrCodeUrl: string;
  backupCodes: string[];
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
  type: 'text' | 'number' | 'single' | 'multiple' | 'sentiment';
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

export type TimelineEventType = 'session' | 'evolution' | 'goal';
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface PatientTimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  badgeVariant: BadgeVariant;
  linkTo: string | null;
}

export interface PatientTimelineResponse {
  patientId: string;
  events: PatientTimelineEvent[];
}

export interface PlanUsageSummary {
  planTier: string;
  patients: { current: number; max: number | null };
  sessionsThisMonth: { current: number; max: number | null };
  aiInsightsEnabled: boolean;
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

// Training Plans
export interface TrainingPlan {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  name: string;
  description: string | null;
  planJson: Record<string, unknown>;
  startDate: string;
  endDate: string | null;
  active: boolean;
  executionsCount: number;
  createdAt?: string;
}
export interface TrainingPlanListResponse {
  data: TrainingPlan[];
  meta: PaginationMeta;
}
export interface CreateTrainingPlanBody {
  patientId: string;
  name: string;
  description?: string;
  planJson: Record<string, unknown>;
  startDate: string;
  endDate?: string;
  active?: boolean;
}

// Training Executions
export interface TrainingExecution {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  trainingPlanId: string | null;
  planName: string | null;
  executedAt: string;
  durationMinutes: number | null;
  notes: string | null;
  completed: boolean;
  createdAt: string;
}
export interface TrainingExecutionListResponse {
  data: TrainingExecution[];
  meta: PaginationMeta;
}
export interface CreateTrainingExecutionBody {
  patientId: string;
  trainingPlanId?: string;
  executedAt: string;
  durationMinutes?: number;
  notes?: string;
  completed?: boolean;
}

export interface UpdateTrainingExecutionBody {
  executedAt?: string;
  durationMinutes?: number | null;
  notes?: string | null;
  completed?: boolean;
}

// Progress Photos
export interface ProgressPhoto {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  imageUrl: string;
  takenAt: string;
  notes: string | null;
  createdAt: string;
}
export interface ProgressPhotoListResponse {
  data: ProgressPhoto[];
  meta: PaginationMeta;
}
export interface CreateProgressPhotoBody {
  patientId: string;
  imageUrl: string;
  takenAt: string;
  notes?: string;
}

// Goals
export type GoalType = 'weight_loss' | 'muscle_gain' | 'performance' | 'health' | 'other';

export interface Goal {
  id: string;
  tenantId: string;
  patientId: string;
  type: GoalType;
  title: string;
  description: string | null;
  currentValue: number | null;
  targetValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  achievedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface GoalListResponse {
  data: Goal[];
  meta: PaginationMeta;
}
export interface CreateGoalBody {
  patientId: string;
  type: GoalType;
  title: string;
  description?: string;
  currentValue?: number;
  targetValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
}
export interface UpdateGoalBody {
  title?: string;
  description?: string;
  currentValue?: number;
  targetValue?: number;
  targetDate?: string;
  achievedAt?: string;
}

// Scheduled Questionnaires
export type QuestionnaireFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface ScheduledQuestionnaire {
  id: string;
  templateId: string;
  templateName: string;
  patientId: string | null;
  patientName: string | null;
  frequency: QuestionnaireFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  active: boolean;
}
export interface ScheduledQuestionnaireListResponse {
  data: ScheduledQuestionnaire[];
  meta: PaginationMeta;
}
export interface CreateScheduledQuestionnaireBody {
  templateId: string;
  patientId?: string;
  frequency: QuestionnaireFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
}

// Diet Plans
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface DietFood {
  name: string;
  quantity: number;
  unit: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DietPlan {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  name: string;
  description: string | null;
  caloriesKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  waterMl: number | null;
  restrictions: string[];
  mealPlanJson: Record<string, unknown> | null;
  basedOnSessionId: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  entriesCount: number;
}

export interface DietPlanListResponse {
  data: DietPlan[];
  meta: PaginationMeta;
}

export interface CreateDietPlanBody {
  patientId: string;
  name: string;
  description?: string;
  caloriesKcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  waterMl?: number;
  restrictions?: string[];
  mealPlanJson?: Record<string, unknown>;
  basedOnSessionId?: string;
  startDate: string;
  endDate?: string;
  active?: boolean;
}

export interface DietEntry {
  id: string;
  patientId: string;
  dietPlanId: string | null;
  planName: string | null;
  entryDate: string;
  mealType: MealType;
  foodsJson: DietFood[];
  totalCalories: number | null;
  totalProteinG: number | null;
  totalCarbsG: number | null;
  totalFatG: number | null;
  waterMl: number | null;
  notes: string | null;
}

export interface DietEntryListResponse {
  data: DietEntry[];
  meta: PaginationMeta;
}

export interface CreateDietEntryBody {
  patientId: string;
  dietPlanId?: string;
  entryDate: string;
  mealType: MealType;
  foodsJson: DietFood[];
  totalCalories?: number;
  totalProteinG?: number;
  totalCarbsG?: number;
  totalFatG?: number;
  waterMl?: number;
  notes?: string;
}

export interface UpdateDietEntryBody {
  entryDate?: string;
  mealType?: MealType;
  foodsJson?: DietFood[];
  totalCalories?: number | null;
  totalProteinG?: number | null;
  totalCarbsG?: number | null;
  totalFatG?: number | null;
  waterMl?: number | null;
  notes?: string | null;
}

export interface DietBodyMetric {
  date: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  leanMassKg: number | null;
}

export interface DietActivePlan {
  id: string;
  name: string;
  caloriesKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  waterMl: number | null;
}

export interface DietTodaySummary {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
}

export interface DietStats {
  streak: number;
  xpTotal: number;
  level: string;
  levelLabel: string;
  nextLevelXp: number;
  xpProgress: number;
  badges: string[];
  macroAdherence: number;
  activePlan: DietActivePlan | null;
  todaySummary: DietTodaySummary;
  bodyMetrics: DietBodyMetric[];
  totalEntries: number;
}
