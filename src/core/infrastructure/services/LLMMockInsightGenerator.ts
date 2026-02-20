import type { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import type { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';
import type { IInsightGenerator, InsightData } from '@ports/services/IInsightGenerator.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Adapter: deterministic mock insight based on answer hash (no external API)
 */
export class LLMMockInsightGenerator implements IInsightGenerator {
  async generate(
    session: AnamnesisSession,
    _template: AnamnesisTemplate
  ): Promise<InsightData> {
    const answers = session.currentAnswersJson ?? {};
    const seed = JSON.stringify(answers)
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rng = (): number => {
      const x = Math.sin(seed * 9999 + 1) * 10000;
      return x - Math.floor(x);
    };

    const summaries = [
      'Análise inicial indica perfil compatível com o programa.',
      'Alguns pontos de atenção foram identificados para acompanhamento.',
      'Respostas sugerem boa adesão potencial com suporte adequado.',
    ];
    const summary = summaries[Math.floor(rng() * summaries.length)];

    const risks = {
      readiness: clamp(40 + rng() * 50),
      dropoutRisk: clamp(20 + rng() * 40),
      stress: clamp(30 + rng() * 50),
      sleepQuality: clamp(35 + rng() * 55),
    };

    const recs = [
      'Manter comunicação regular com a equipe.',
      'Estabelecer metas semanais pequenas e alcançáveis.',
      'Registrar dúvidas e progressos no app.',
    ];
    const n = 1 + Math.floor(rng() * 2);
    const recommendations = recs.sort(() => rng() - 0.5).slice(0, n);

    return { summary, risks, recommendations };
  }
}
