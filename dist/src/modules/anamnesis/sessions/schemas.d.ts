import { z } from 'zod';
export declare const createSessionSchema: z.ZodObject<{
    templateId: z.ZodString;
    subjectId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    templateId: string;
    subjectId?: string | undefined;
}, {
    templateId: string;
    subjectId?: string | undefined;
}>;
export declare const createAnswersSchema: z.ZodObject<{
    answersJson: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    answersJson: Record<string, unknown>;
}, {
    answersJson: Record<string, unknown>;
}>;
export type CreateSessionBody = z.infer<typeof createSessionSchema>;
export type CreateAnswersBody = z.infer<typeof createAnswersSchema>;
//# sourceMappingURL=schemas.d.ts.map