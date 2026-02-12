function clamp(n) {
    return Math.max(0, Math.min(100, Math.round(n)));
}
/**
 * Rule-based strategy: derive summary, risks (0-100), and recommendations from answers.
 */
export function generateInsightsRuleBased(template, answers) {
    const parts = [];
    let stressScore = 50;
    let sleepScore = 50;
    let readinessScore = 50;
    let dropoutRisk = 30;
    for (const q of template.questions) {
        const v = answers[q.id];
        if (v === undefined || v === '')
            continue;
        if (q.tags?.includes('stress')) {
            if (q.id === 'q3') {
                const map = {
                    Nunca: 10,
                    Raramente: 30,
                    'Às vezes': 50,
                    Frequentemente: 75,
                    Sempre: 95,
                };
                stressScore = map[String(v)] ?? 50;
            }
            if (q.id === 'q4' && typeof v === 'number')
                stressScore = clamp(Number(v) * 10);
        }
        if (q.tags?.includes('sleep')) {
            if (q.id === 'q1' && typeof v === 'number')
                sleepScore = clamp(Number(v) * 10);
            if (q.id === 'q2' && typeof v === 'number') {
                const h = Number(v);
                if (h < 6)
                    sleepScore = Math.min(sleepScore, 40);
                else if (h >= 7)
                    sleepScore = Math.max(sleepScore, 60);
            }
        }
        if (q.id === 'q6') {
            const map = {
                Nunca: 40,
                '1-2x/semana': 55,
                '3-4x/semana': 70,
                '5+ vezes/semana': 85,
            };
            readinessScore = map[String(v)] ?? 50;
        }
        if (q.tags?.includes('food_emotional') && (v === 'Frequentemente' || v === 'Às vezes')) {
            dropoutRisk = Math.min(100, dropoutRisk + 15);
        }
    }
    if (stressScore > 70)
        parts.push('Nível de estresse elevado identificado.');
    if (sleepScore < 50)
        parts.push('Qualidade de sono pode ser melhorada.');
    if (readinessScore >= 60)
        parts.push('Disposição para mudança positiva.');
    if (parts.length === 0)
        parts.push('Perfil inicial registrado com sucesso.');
    const summary = parts.join(' ');
    const risks = {
        readiness: clamp(readinessScore),
        dropoutRisk: clamp(dropoutRisk),
        stress: clamp(stressScore),
        sleepQuality: clamp(sleepScore),
    };
    const recommendations = [];
    if (risks.stress > 60)
        recommendations.push('Considerar técnicas de manejo de estresse e respiração.');
    if (risks.sleepQuality < 50)
        recommendations.push('Priorizar higiene do sono e horários regulares.');
    if (risks.dropoutRisk > 50)
        recommendations.push('Acompanhamento mais frequente pode aumentar adesão.');
    if (recommendations.length === 0)
        recommendations.push('Manter hábitos atuais e acompanhar evolução.');
    return { summary, risks, recommendations };
}
/**
 * LLM mock: deterministic varied text using seed from answers (no external API).
 */
export function generateInsightsLlmMock(template, answers) {
    const seed = JSON.stringify(answers).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rng = () => {
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
export function generateInsights(mode, template, answers) {
    return mode === 'llmMock'
        ? generateInsightsLlmMock(template, answers)
        : generateInsightsRuleBased(template, answers);
}
//# sourceMappingURL=service.js.map