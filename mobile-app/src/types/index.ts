export interface PatientUser {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  patientId: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: PatientUser;
}

export interface MeResponse {
  patient: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    birthDate: string | null;
  };
  sessionsCount: number;
  evolutionsCount: number;
  goalsCount: number;
}

export interface TrainingPlanSummary {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  executionsCount: number;
}

/** Campos opcionais de mídia para exercícios no planJson (foto estática e/ou GIF do movimento). */
export interface ExerciseMedia {
  /** URL de imagem estática do exercício. */
  imageUrl?: string | null;
  /** URL de GIF (animação) do movimento para o aluno reproduzir. */
  gifUrl?: string | null;
}

export interface TrainingPlanDetail extends TrainingPlanSummary {
  planJson: Record<string, unknown>;
  executions?: TrainingExecution[];
  recentExecutions?: TrainingExecution[];
}

export interface TrainingExecution {
  id: string;
  executedAt: string;
  completed?: boolean;
  durationMinutes?: number | null;
  coachNotes?: string | null;
}

export interface DietPlanSummary {
  id: string;
  name: string;
  description: string | null;
  caloriesKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  waterMl: number | null;
  restrictions: string[];
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export interface DietPlanDetail extends DietPlanSummary {
  mealPlanJson: Record<string, unknown> | null;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ---- Treino ativo (checklist + carga por série) ----

/** Uma série registrada pelo aluno (peso e reps). */
export interface WorkoutSetRecord {
  completed: boolean;
  weightKg?: number | null;
  reps?: number | null;
}

/** Registro de um exercício dentro de um treino salvo. */
export interface WorkoutExerciseLog {
  exerciseName: string;
  suggestedSets?: string;
  suggestedReps?: string;
  sets: WorkoutSetRecord[];
}

/** Log completo de um treino realizado (salvo localmente e exibido no histórico). */
export interface SavedWorkoutLog {
  id: string;
  planId: string;
  planName: string;
  dayLabel: string;
  executedAt: string; // ISO
  durationMinutes: number | null;
  notes?: string | null;
  exercises: WorkoutExerciseLog[];
}

/** Registro de peso corporal (data e valor em kg). */
export interface WeightEntry {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  valueKg: number;
}

/** Foto de progresso (uri local ou base64; ângulo opcional). */
export interface ProgressPhoto {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  uri: string;
  angle?: 'front' | 'side' | 'back';
}

/** Consumo de água no dia (ml). */
export interface WaterEntry {
  date: string; // YYYY-MM-DD
  ml: number;
}

/** Registro de uma refeição. */
export interface MealLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  name: string;
  kcal?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
}

/** Medidas corporais (cm) em uma data. */
export interface BodyMeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  waistCm?: number | null;   // cintura
  hipCm?: number | null;     // quadril
  chestCm?: number | null;   // peito
  armLeftCm?: number | null;  // braço esquerdo
  armRightCm?: number | null; // braço direito
  thighLeftCm?: number | null;
  thighRightCm?: number | null;
  neckCm?: number | null;
}

/** Snapshot de métricas importadas de integrações Health. */
export interface HealthMetricsEntry {
  id: string;
  provider: 'apple_health' | 'google_fit';
  date: string; // YYYY-MM-DD
  steps?: number | null;
  activeMinutes?: number | null;
  sleepMinutes?: number | null;
  source: 'pedometer' | 'manual_fallback' | 'native_bridge';
}
