import { z } from 'zod';

export const createSessionSchema = z.object({
  templateId: z.string(),
  subjectId: z.string().optional(),
  patientId: z.string().optional(),
});

export const createAnswersSchema = z.object({
  answersJson: z.record(z.unknown()),
});

export const signSessionSchema = z.object({
  signerName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  agreed: z.literal(true, { errorMap: () => ({ message: 'É necessário concordar para assinar' }) }),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;
export type CreateAnswersBody = z.infer<typeof createAnswersSchema>;
export type SignSessionBody = z.infer<typeof signSessionSchema>;
