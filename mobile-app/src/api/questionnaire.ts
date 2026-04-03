import { apiFetch } from './client';

export type QuestionnaireQuestionType = 'text' | 'number' | 'single' | 'multiple' | 'sentiment';

export interface QuestionnaireQuestion {
  id: string;
  label: string;
  description?: string | null;
  type: QuestionnaireQuestionType;
  required?: boolean;
  options?: string[];
}

export interface FillQuestionnaireResponse {
  id: string;
  title: string;
  description?: string | null;
  questions: QuestionnaireQuestion[];
  initialAnswers?: Record<string, QuestionnaireAnswerValue>;
}

export type QuestionnaireAnswerValue = string | number | string[];

export interface SubmitFillPayload {
  answers: Array<{
    questionId: string;
    value: QuestionnaireAnswerValue;
  }>;
}

interface BackendQuestionnaireSchema {
  questions?: Array<{
    id: string;
    text: string;
    description?: string | null;
    type: QuestionnaireQuestionType;
    required?: boolean;
    options?: string[];
  }>;
}

interface BackendFillQuestionnaireResponse {
  sessionId: string;
  tenantId: string;
  status: string;
  templateName: string;
  schema: BackendQuestionnaireSchema | null;
  currentAnswers?: Record<string, unknown>;
}

function normalizeQuestionnaireResponse(
  payload: BackendFillQuestionnaireResponse
): FillQuestionnaireResponse {
  const questions = Array.isArray(payload.schema?.questions) ? payload.schema.questions : [];
  return {
    id: payload.sessionId,
    title: payload.templateName,
    description: payload.status === 'completed' ? 'Este questionário já foi concluído.' : null,
    questions: questions.map((question) => ({
      id: question.id,
      label: question.text,
      description: question.description ?? null,
      type: question.type,
      required: question.required ?? false,
      options: question.options,
    })),
    initialAnswers: (payload.currentAnswers as Record<string, QuestionnaireAnswerValue> | undefined) ?? {},
  };
}

export function toBackendAnswersMap(payload: SubmitFillPayload): Record<string, QuestionnaireAnswerValue> {
  return payload.answers.reduce<Record<string, QuestionnaireAnswerValue>>((acc, answer) => {
    acc[answer.questionId] = answer.value;
    return acc;
  }, {});
}

export async function getFillQuestionnaire(fillToken: string): Promise<FillQuestionnaireResponse> {
  const result = await apiFetch<BackendFillQuestionnaireResponse>(
    `/v1/public/fill/${encodeURIComponent(fillToken)}`
  );
  return normalizeQuestionnaireResponse(result);
}

export async function submitFillQuestionnaire(
  fillToken: string,
  payload: SubmitFillPayload
): Promise<{ success: boolean }> {
  const result = await apiFetch<{ completed: boolean }>(
    `/v1/public/fill/${encodeURIComponent(fillToken)}/answers`,
    {
      method: 'POST',
      body: JSON.stringify({ answersJson: toBackendAnswersMap(payload) }),
    }
  );
  return { success: result.completed };
}
