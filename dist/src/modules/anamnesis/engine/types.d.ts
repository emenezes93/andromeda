import type { TemplateSchemaJson, QuestionSchema } from '../../../shared/types/index.js';
export interface NextQuestionRequest {
    sessionId: string;
    currentAnswers: Record<string, unknown>;
}
export interface NextQuestionResponse {
    nextQuestion: QuestionSchema | null;
    reason: string;
    completionPercent: number;
}
export type SchemaWithQuestions = TemplateSchemaJson;
//# sourceMappingURL=types.d.ts.map