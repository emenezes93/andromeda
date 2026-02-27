import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import type { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';
import type { IInsightGenerator, InsightData } from '@ports/services/IInsightGenerator.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';

const InsightSchema = z.object({
  summary: z
    .string()
    .describe('Resumo clínico em 2-3 frases sobre o perfil do paciente com base nas respostas'),
  risks: z.object({
    readiness: z
      .number()
      .describe('Disposição para mudança de 0 a 100 (0=sem disposição, 100=alta disposição)'),
    dropoutRisk: z
      .number()
      .describe('Risco de abandono de 0 a 100 (0=baixo risco, 100=alto risco)'),
    stress: z
      .number()
      .describe('Nível de estresse de 0 a 100 (0=sem estresse, 100=estresse extremo)'),
    sleepQuality: z
      .number()
      .describe('Qualidade do sono de 0 a 100 (0=péssima qualidade, 100=excelente qualidade)'),
  }),
  recommendations: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Lista de 1 a 5 recomendações clínicas específicas e acionáveis'),
});

function buildPrompt(session: AnamnesisSession, template: AnamnesisTemplate): string {
  const schema = template.schemaJson as TemplateSchemaJson | null;
  const questions = schema?.questions ?? [];
  const answers = session.currentAnswersJson ?? {};

  const qaLines = questions
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
    .map((q) => `- ${q.text}: ${String(answers[q.id])}`)
    .join('\n');

  const templatePrompt = template.llmPrompt?.trim()
    ? `\n\nContexto do protocolo clínico:\n${template.llmPrompt}`
    : '';

  return `Você é um especialista em saúde e comportamento. Analise as respostas abaixo de um questionário de anamnese e gere um insight clínico estruturado.${templatePrompt}

Respostas do paciente:
${qaLines || '(Nenhuma resposta registrada)'}

Gere o insight seguindo exatamente o formato solicitado. Os scores de risco devem ser inteiros entre 0 e 100. As recomendações devem ser específicas, práticas e baseadas nas respostas fornecidas.`;
}

/**
 * Adapter: real LLM insight generation using Anthropic claude-opus-4-6.
 * Activated when AI_MODE=llm and AI_PROVIDER=anthropic.
 */
export class LlmInsightGenerator implements IInsightGenerator {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model = 'claude-opus-4-6') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generate(session: AnamnesisSession, template: AnamnesisTemplate): Promise<InsightData> {
    const prompt = buildPrompt(session, template);

    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      output_config: {
        format: zodOutputFormat(InsightSchema),
      },
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      throw new Error('LLM returned empty or unparseable insight response');
    }

    const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

    return {
      summary: parsed.summary,
      risks: {
        readiness: clamp(parsed.risks.readiness),
        dropoutRisk: clamp(parsed.risks.dropoutRisk),
        stress: clamp(parsed.risks.stress),
        sleepQuality: clamp(parsed.risks.sleepQuality),
      },
      recommendations: parsed.recommendations,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
