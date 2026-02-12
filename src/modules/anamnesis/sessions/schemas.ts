import { z } from 'zod';

export const createSessionSchema = z.object({
  templateId: z.string(),
  subjectId: z.string().optional(),
});

export const createAnswersSchema = z.object({
  answersJson: z.record(z.unknown()),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;
export type CreateAnswersBody = z.infer<typeof createAnswersSchema>;
