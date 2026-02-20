/**
 * Port: Question selection engine (conditional logic + heuristic deepening).
 * Implementations are stateless and do not depend on Prisma.
 */
export interface NextQuestionResult {
  nextQuestion: unknown | null;
  reason: string;
  completionPercent: number;
}

export interface IQuestionEngine {
  selectNextQuestion(
    schemaJson: unknown,
    currentAnswers: Record<string, unknown>
  ): NextQuestionResult;
}
