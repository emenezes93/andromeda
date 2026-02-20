import { z } from 'zod';

const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['text', 'number', 'single', 'multiple', 'sentiment']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  tags: z.array(z.string()).optional(),
  showWhen: z
    .object({
      questionId: z.string(),
      operator: z.enum(['eq', 'in']),
      value: z.union([z.string(), z.array(z.string())]),
    })
    .optional(),
});

const conditionalRuleSchema = z.object({
  ifQuestion: z.string(),
  ifValue: z.union([z.string(), z.array(z.string())]),
  thenShow: z.array(z.string()),
});

export const schemaJsonSchema = z.object({
  questions: z.array(questionSchema),
  conditionalLogic: z.array(conditionalRuleSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  schemaJson: schemaJsonSchema,
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateBody = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateSchema>;
