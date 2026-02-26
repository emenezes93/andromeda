/**
 * A/B Tests — Insight Generators
 *
 * Objetivo: comparar o comportamento dos dois modos de geração de insights
 * (Mode A = RuleBasedInsightGenerator, Mode B = LLMMockInsightGenerator)
 * usando a mesma bateria de contratos compartilhados, mais testes profundos
 * específicos a cada modo.
 *
 * Estrutura:
 *   1. Contrato compartilhado (describe.each — roda contra A e B)
 *   2. Modo A — RuleBased: mapeamento de tags, pontuação, limiares, resumo
 *   3. Modo B — LLMMock: determinismo de hash, cobertura de RNG, garantias
 */

import { describe, it, expect } from 'vitest';
import { RuleBasedInsightGenerator } from '@infrastructure/services/RuleBasedInsightGenerator.js';
import { LLMMockInsightGenerator } from '@infrastructure/services/LLMMockInsightGenerator.js';
import { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';
import type { IInsightGenerator } from '@ports/services/IInsightGenerator.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeSession = (answers: Record<string, unknown> = {}) =>
  new AnamnesisSession(
    's-ab', 't-1', 'tpl-ab', 'user-1', 'patient-1',
    'completed', null, null, null, new Date(), null,
    answers,
  );

const makeTemplate = (schema: TemplateSchemaJson) =>
  new AnamnesisTemplate('tpl-ab', 't-1', 'AB Template', 1, schema, null, null, new Date());

/** Template com 1 pergunta numérica de tag stress */
const stressNumberSchema = (tag = 'stress'): TemplateSchemaJson => ({
  questions: [{ id: 'qs', text: 'Stress (1-10)', type: 'number', required: true, tags: [tag] }],
});

/** Template com 1 pergunta single de tag stress, 4 opções */
const stressSingleSchema: TemplateSchemaJson = {
  questions: [{
    id: 'qs', text: 'Nível de estresse', type: 'single',
    options: ['Nunca', 'Às vezes', 'Frequentemente', 'Sempre'],
    required: true, tags: ['stress'],
  }],
};

/** Template com 1 pergunta numérica de tag sleep */
const sleepSchema: TemplateSchemaJson = {
  questions: [{ id: 'qsl', text: 'Sono (1-10)', type: 'number', required: true, tags: ['sleep'] }],
};

// ─── 1. CONTRATO COMPARTILHADO (A/B) ─────────────────────────────────────────
//
// Os dois geradores devem honrar exatamente o mesmo contrato de interface,
// independente da lógica interna.

describe.each([
  ['Modo A — RuleBased', new RuleBasedInsightGenerator() as IInsightGenerator],
  ['Modo B — LLMMock', new LLMMockInsightGenerator() as IInsightGenerator],
])('%s: contrato de interface', (_label, generator) => {

  it('retorna summary como string não-vazia', async () => {
    const out = await generator.generate(makeSession({ qs: 5 }), makeTemplate(stressNumberSchema()));
    expect(typeof out.summary).toBe('string');
    expect(out.summary.length).toBeGreaterThan(0);
  });

  it('retorna os 4 campos de risco obrigatórios', async () => {
    const out = await generator.generate(makeSession({ qs: 5 }), makeTemplate(stressNumberSchema()));
    expect(out.risks).toHaveProperty('readiness');
    expect(out.risks).toHaveProperty('dropoutRisk');
    expect(out.risks).toHaveProperty('stress');
    expect(out.risks).toHaveProperty('sleepQuality');
  });

  it('todos os riscos estão na faixa [0, 100]', async () => {
    const out = await generator.generate(makeSession({ qs: 5 }), makeTemplate(stressNumberSchema()));
    for (const val of Object.values(out.risks)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  it('todos os riscos são inteiros', async () => {
    const out = await generator.generate(makeSession({ qs: 5 }), makeTemplate(stressNumberSchema()));
    for (const val of Object.values(out.risks)) {
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('retorna recommendations como array não-vazio de strings', async () => {
    const out = await generator.generate(makeSession({ qs: 5 }), makeTemplate(stressNumberSchema()));
    expect(Array.isArray(out.recommendations)).toBe(true);
    expect(out.recommendations.length).toBeGreaterThanOrEqual(1);
    for (const r of out.recommendations) {
      expect(typeof r).toBe('string');
    }
  });

  it('não lança exceção com answers vazio {}', async () => {
    await expect(
      generator.generate(makeSession({}), makeTemplate(stressNumberSchema()))
    ).resolves.toBeDefined();
  });

  it('não lança exceção com template sem perguntas', async () => {
    await expect(
      generator.generate(makeSession({ qs: 5 }), makeTemplate({ questions: [] }))
    ).resolves.toBeDefined();
  });

  it('é idempotente — mesma entrada produz mesma saída em chamadas consecutivas', async () => {
    const answers = { qs: 7, qsl: 3 };
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qs', text: 'Stress', type: 'number', required: true, tags: ['stress'] },
        { id: 'qsl', text: 'Sono', type: 'number', required: true, tags: ['sleep'] },
      ],
    };
    const t = makeTemplate(schema);
    const out1 = await generator.generate(makeSession(answers), t);
    const out2 = await generator.generate(makeSession(answers), t);
    expect(out1.summary).toBe(out2.summary);
    expect(out1.risks).toEqual(out2.risks);
    expect(out1.recommendations).toEqual(out2.recommendations);
  });

  it('não lança exceção com resposta number fora de intervalo (0 e 999)', async () => {
    await expect(
      generator.generate(makeSession({ qs: 0 }), makeTemplate(stressNumberSchema()))
    ).resolves.toBeDefined();
    await expect(
      generator.generate(makeSession({ qs: 999 }), makeTemplate(stressNumberSchema()))
    ).resolves.toBeDefined();
  });

  it('lida com valores null/undefined nas respostas sem lançar', async () => {
    await expect(
      generator.generate(
        makeSession({ qs: null as unknown, qsl: undefined }),
        makeTemplate(stressNumberSchema()),
      )
    ).resolves.toBeDefined();
  });
});

// ─── 2. MODO A — RULEBASED: testes profundos ─────────────────────────────────

describe('Modo A — RuleBasedInsightGenerator: pontuação de número', () => {
  const gen = new RuleBasedInsightGenerator();

  // Fórmula: clamp(((n - 1) / 9) * 100)
  it('n=1 (mínimo) → stress = 0', async () => {
    const out = await gen.generate(makeSession({ qs: 1 }), makeTemplate(stressNumberSchema()));
    expect(out.risks.stress).toBe(0);
  });

  it('n=10 (máximo) → stress = 100', async () => {
    const out = await gen.generate(makeSession({ qs: 10 }), makeTemplate(stressNumberSchema()));
    expect(out.risks.stress).toBe(100);
  });

  it('n=5 (meio) → stress ≈ 44 (arredondado)', async () => {
    const out = await gen.generate(makeSession({ qs: 5 }), makeTemplate(stressNumberSchema()));
    // ((5-1)/9)*100 = 44.44... → 44
    expect(out.risks.stress).toBe(44);
  });

  it('n=0 (abaixo do mínimo) → stress clampado em 0', async () => {
    const out = await gen.generate(makeSession({ qs: 0 }), makeTemplate(stressNumberSchema()));
    expect(out.risks.stress).toBe(0);
  });

  it('n=11 (acima do máximo) → stress clampado em 100', async () => {
    const out = await gen.generate(makeSession({ qs: 11 }), makeTemplate(stressNumberSchema()));
    expect(out.risks.stress).toBe(100);
  });

  it('resposta NaN (texto não numérico) → stress permanece no default 50', async () => {
    const out = await gen.generate(
      makeSession({ qs: 'texto' }),
      makeTemplate(stressNumberSchema()),
    );
    expect(out.risks.stress).toBe(50);
  });

  it('resposta float válida → pontuação calculada corretamente', async () => {
    // ((5.5-1)/9)*100 = 50.00 exato
    const out = await gen.generate(makeSession({ qs: 5.5 }), makeTemplate(stressNumberSchema()));
    expect(out.risks.stress).toBe(50);
  });
});

describe('Modo A — RuleBasedInsightGenerator: pontuação de single choice', () => {
  const gen = new RuleBasedInsightGenerator();
  // Opções: ['Nunca','Às vezes','Frequentemente','Sempre'] (4 opções, índices 0-3)
  // Fórmula: clamp((idx / (n-1)) * 100)

  it("'Nunca' (idx=0) → stress = 0", async () => {
    const out = await gen.generate(
      makeSession({ qs: 'Nunca' }),
      makeTemplate(stressSingleSchema),
    );
    expect(out.risks.stress).toBe(0);
  });

  it("'Às vezes' (idx=1) → stress = 33", async () => {
    const out = await gen.generate(
      makeSession({ qs: 'Às vezes' }),
      makeTemplate(stressSingleSchema),
    );
    // (1/3)*100 = 33.33 → 33
    expect(out.risks.stress).toBe(33);
  });

  it("'Frequentemente' (idx=2) → stress = 67", async () => {
    const out = await gen.generate(
      makeSession({ qs: 'Frequentemente' }),
      makeTemplate(stressSingleSchema),
    );
    // (2/3)*100 = 66.66 → 67
    expect(out.risks.stress).toBe(67);
  });

  it("'Sempre' (idx=3) → stress = 100", async () => {
    const out = await gen.generate(
      makeSession({ qs: 'Sempre' }),
      makeTemplate(stressSingleSchema),
    );
    expect(out.risks.stress).toBe(100);
  });

  it('opção com 2 itens: primeiro → 0, último → 100', async () => {
    const schema: TemplateSchemaJson = {
      questions: [{
        id: 'qs', text: 'Binário', type: 'single',
        options: ['Não', 'Sim'],
        required: true, tags: ['stress'],
      }],
    };
    const outNao = await gen.generate(makeSession({ qs: 'Não' }), makeTemplate(schema));
    const outSim = await gen.generate(makeSession({ qs: 'Sim' }), makeTemplate(schema));
    expect(outNao.risks.stress).toBe(0);
    expect(outSim.risks.stress).toBe(100);
  });

  it('opção com 1 item: qualquer resposta válida → 50 (caso limite)', async () => {
    const schema: TemplateSchemaJson = {
      questions: [{
        id: 'qs', text: 'Único', type: 'single',
        options: ['Apenas'],
        required: true, tags: ['stress'],
      }],
    };
    const out = await gen.generate(makeSession({ qs: 'Apenas' }), makeTemplate(schema));
    expect(out.risks.stress).toBe(50);
  });

  it('opção inválida (não pertence ao array) → stress permanece no default 50', async () => {
    const out = await gen.generate(
      makeSession({ qs: 'OpçãoInexistente' }),
      makeTemplate(stressSingleSchema),
    );
    expect(out.risks.stress).toBe(50);
  });
});

describe('Modo A — RuleBasedInsightGenerator: mapeamento de tags para métricas', () => {
  const gen = new RuleBasedInsightGenerator();

  it("tag 'sleep' alimenta sleepQuality", async () => {
    const out = await gen.generate(makeSession({ qsl: 10 }), makeTemplate(sleepSchema));
    // n=10 → 100
    expect(out.risks.sleepQuality).toBe(100);
  });

  it("tag 'exercise' alimenta readiness", async () => {
    const schema = stressNumberSchema('exercise');
    const out = await gen.generate(makeSession({ qs: 10 }), makeTemplate(schema));
    expect(out.risks.readiness).toBe(100);
  });

  it("tag 'physical_activity' alimenta readiness", async () => {
    const schema = stressNumberSchema('physical_activity');
    const out = await gen.generate(makeSession({ qs: 10 }), makeTemplate(schema));
    expect(out.risks.readiness).toBe(100);
  });

  it("tag 'food_emotional' alimenta dropoutRisk", async () => {
    const schema = stressNumberSchema('food_emotional');
    const out = await gen.generate(makeSession({ qs: 10 }), makeTemplate(schema));
    expect(out.risks.dropoutRisk).toBe(100);
  });

  it("tag 'dropout' alimenta dropoutRisk", async () => {
    const schema = stressNumberSchema('dropout');
    const out = await gen.generate(makeSession({ qs: 10 }), makeTemplate(schema));
    expect(out.risks.dropoutRisk).toBe(100);
  });

  it('pergunta com múltiplas tags alimenta ambas as métricas', async () => {
    const schema: TemplateSchemaJson = {
      questions: [{
        id: 'qm', text: 'Multi', type: 'number', required: true,
        tags: ['stress', 'sleep'],
      }],
    };
    // n=10 → score=100
    const out = await gen.generate(makeSession({ qm: 10 }), makeTemplate(schema));
    expect(out.risks.stress).toBe(100);
    expect(out.risks.sleepQuality).toBe(100);
  });

  it('múltiplas perguntas com a mesma tag → média (avg)', async () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'q1', text: 'S1', type: 'number', required: true, tags: ['stress'] },
        { id: 'q2', text: 'S2', type: 'number', required: true, tags: ['stress'] },
      ],
    };
    // q1: n=1 → 0, q2: n=10 → 100 → avg = 50
    const out = await gen.generate(makeSession({ q1: 1, q2: 10 }), makeTemplate(schema));
    expect(out.risks.stress).toBe(50);
  });

  it('pergunta sem tags é ignorada (não afeta nenhuma métrica)', async () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qn', text: 'Sem tag', type: 'number', required: true },
      ],
    };
    // Sem tags → todos os riscos ficam no default
    const out = await gen.generate(makeSession({ qn: 10 }), makeTemplate(schema));
    expect(out.risks.stress).toBe(50);
    expect(out.risks.sleepQuality).toBe(50);
    expect(out.risks.readiness).toBe(50);
    expect(out.risks.dropoutRisk).toBe(30);
  });

  it('pergunta do tipo text é ignorada (sem score)', async () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qt', text: 'Descrição', type: 'text', required: true, tags: ['stress'] },
      ],
    };
    const out = await gen.generate(
      makeSession({ qt: 'algum texto' }),
      makeTemplate(schema),
    );
    expect(out.risks.stress).toBe(50);
  });
});

describe('Modo A — RuleBasedInsightGenerator: limiares de recomendação', () => {
  const gen = new RuleBasedInsightGenerator();

  // stress > 60 → recomendação de estresse
  // n=6 → score=56 (abaixo); n=7 → score=67 (acima)

  it('stress=56 (< 60) → NÃO inclui recomendação de estresse', async () => {
    const out = await gen.generate(makeSession({ qs: 6 }), makeTemplate(stressNumberSchema()));
    const hasRec = out.recommendations.some((r) => r.toLowerCase().includes('estresse'));
    expect(hasRec).toBe(false);
  });

  it('stress=67 (> 60) → inclui recomendação de estresse', async () => {
    const out = await gen.generate(makeSession({ qs: 7 }), makeTemplate(stressNumberSchema()));
    const hasRec = out.recommendations.some((r) => r.toLowerCase().includes('estresse'));
    expect(hasRec).toBe(true);
  });

  // sleepQuality < 50 → recomendação de sono
  // n=5 → score=44 (abaixo); n=6 → score=56 (acima)

  it('sleepQuality=44 (< 50) → inclui recomendação de sono', async () => {
    const out = await gen.generate(makeSession({ qsl: 5 }), makeTemplate(sleepSchema));
    const hasRec = out.recommendations.some((r) => r.toLowerCase().includes('sono'));
    expect(hasRec).toBe(true);
  });

  it('sleepQuality=56 (>= 50) → NÃO inclui recomendação de sono', async () => {
    const out = await gen.generate(makeSession({ qsl: 6 }), makeTemplate(sleepSchema));
    const hasRec = out.recommendations.some((r) => r.toLowerCase().includes('sono'));
    expect(hasRec).toBe(false);
  });

  // dropoutRisk > 50 → recomendação de acompanhamento
  // n=5 → score=44 (abaixo); n=7 → score=67 (acima)

  it('dropoutRisk=44 (<= 50) → NÃO inclui recomendação de adesão', async () => {
    const schema = stressNumberSchema('food_emotional');
    const out = await gen.generate(makeSession({ qs: 5 }), makeTemplate(schema));
    const hasRec = out.recommendations.some((r) => r.toLowerCase().includes('ades'));
    expect(hasRec).toBe(false);
  });

  it('dropoutRisk=67 (> 50) → inclui recomendação de adesão', async () => {
    const schema = stressNumberSchema('food_emotional');
    const out = await gen.generate(makeSession({ qs: 7 }), makeTemplate(schema));
    const hasRec = out.recommendations.some((r) => r.toLowerCase().includes('ades'));
    expect(hasRec).toBe(true);
  });

  it('sem nenhuma condição ativa → recomendação fallback padrão', async () => {
    // Sem respostas → todos no default (stress=50 ≤ 60, sleep=50 ≥ 50, dropout=30 ≤ 50)
    const out = await gen.generate(makeSession({}), makeTemplate(stressNumberSchema()));
    expect(out.recommendations.length).toBe(1);
    expect(out.recommendations[0]).toMatch(/manter/i);
  });

  it('múltiplas condições ativas → múltiplas recomendações', async () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qs', text: 'Stress', type: 'number', required: true, tags: ['stress'] },
        { id: 'qsl', text: 'Sono', type: 'number', required: true, tags: ['sleep'] },
        { id: 'qd', text: 'Desistência', type: 'number', required: true, tags: ['food_emotional'] },
      ],
    };
    // n=8 → 78 > 60 (stress rec), n=5 → 44 < 50 (sleep rec), n=7 → 67 > 50 (dropout rec)
    const out = await gen.generate(
      makeSession({ qs: 8, qsl: 5, qd: 7 }),
      makeTemplate(schema),
    );
    expect(out.recommendations.length).toBe(3);
  });
});

describe('Modo A — RuleBasedInsightGenerator: limiares de summary', () => {
  const gen = new RuleBasedInsightGenerator();

  // stress > 70 → "Nível de estresse elevado identificado."
  // n=7 → 67 (não > 70); n=8 → 78 (> 70)

  it('stress=67 (≤ 70) → summary NÃO menciona estresse elevado', async () => {
    const out = await gen.generate(makeSession({ qs: 7 }), makeTemplate(stressNumberSchema()));
    expect(out.summary).not.toContain('elevado');
  });

  it('stress=78 (> 70) → summary menciona "estresse elevado"', async () => {
    const out = await gen.generate(makeSession({ qs: 8 }), makeTemplate(stressNumberSchema()));
    expect(out.summary).toContain('elevado');
  });

  // sleepQuality < 50 → "Qualidade de sono pode ser melhorada."
  // n=5 → 44 < 50; n=6 → 56 ≥ 50

  it('sleepQuality=44 (< 50) → summary menciona sono', async () => {
    const out = await gen.generate(makeSession({ qsl: 5 }), makeTemplate(sleepSchema));
    expect(out.summary).toContain('sono');
  });

  it('sleepQuality=56 (>= 50) → summary NÃO menciona sono', async () => {
    const out = await gen.generate(makeSession({ qsl: 6 }), makeTemplate(sleepSchema));
    expect(out.summary).not.toContain('sono');
  });

  // readiness >= 60 → "Disposição para mudança positiva."
  // n=6 → 56 (< 60); n=7 → 67 (>= 60)

  it('readiness=56 (< 60) → summary NÃO menciona "Disposição"', async () => {
    const schema = stressNumberSchema('exercise');
    const out = await gen.generate(makeSession({ qs: 6 }), makeTemplate(schema));
    expect(out.summary).not.toContain('Disposição');
  });

  it('readiness=67 (>= 60) → summary menciona "Disposição"', async () => {
    const schema = stressNumberSchema('exercise');
    const out = await gen.generate(makeSession({ qs: 7 }), makeTemplate(schema));
    expect(out.summary).toContain('Disposição');
  });

  it('nenhuma condição ativa → summary é "Perfil inicial registrado com sucesso."', async () => {
    // Sem respostas → defaults não disparam nenhuma condição de summary
    const out = await gen.generate(makeSession({}), makeTemplate(stressNumberSchema()));
    expect(out.summary).toBe('Perfil inicial registrado com sucesso.');
  });

  it('múltiplas condições de summary ativas → summary concatena todas', async () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qs', text: 'Stress', type: 'number', required: true, tags: ['stress'] },
        { id: 'qex', text: 'Exercício', type: 'number', required: true, tags: ['exercise'] },
      ],
    };
    // n=9 para ambos: stress=89 > 70 E readiness=89 >= 60
    const out = await gen.generate(
      makeSession({ qs: 9, qex: 9 }),
      makeTemplate(schema),
    );
    expect(out.summary).toContain('elevado');
    expect(out.summary).toContain('Disposição');
  });
});

describe('Modo A — RuleBasedInsightGenerator: defaults sem respostas', () => {
  const gen = new RuleBasedInsightGenerator();

  it('sem respostas → stress=50, sleepQuality=50, readiness=50, dropoutRisk=30', async () => {
    const out = await gen.generate(makeSession({}), makeTemplate(stressNumberSchema()));
    expect(out.risks.stress).toBe(50);
    expect(out.risks.sleepQuality).toBe(50);
    expect(out.risks.readiness).toBe(50);
    expect(out.risks.dropoutRisk).toBe(30);
  });
});

// ─── 3. MODO B — LLMMOCK: testes profundos ───────────────────────────────────

describe('Modo B — LLMMockInsightGenerator: determinismo de hash', () => {
  const gen = new LLMMockInsightGenerator();

  it('answers vazio {} → resultado consistente entre chamadas', async () => {
    const t = makeTemplate(stressNumberSchema());
    const out1 = await gen.generate(makeSession({}), t);
    const out2 = await gen.generate(makeSession({}), t);
    expect(out1.summary).toBe(out2.summary);
    expect(out1.risks).toEqual(out2.risks);
    expect(out1.recommendations).toEqual(out2.recommendations);
  });

  it('answers com inteiros grandes → resultado consistente entre chamadas', async () => {
    const answers = { q1: 9999999, q2: -1 };
    const t = makeTemplate(stressNumberSchema());
    const out1 = await gen.generate(makeSession(answers), t);
    const out2 = await gen.generate(makeSession(answers), t);
    expect(out1.risks).toEqual(out2.risks);
  });

  it('answers com string longa → resultado consistente entre chamadas', async () => {
    const answers = { q1: 'A'.repeat(5000) };
    const t = makeTemplate(stressNumberSchema());
    const out1 = await gen.generate(makeSession(answers), t);
    const out2 = await gen.generate(makeSession(answers), t);
    expect(out1.summary).toBe(out2.summary);
  });

  it('answers com caracteres especiais/unicode → sem lançar exceção', async () => {
    const answers = { q1: '安全 🚀 <script>alert(1)</script>' };
    await expect(
      gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()))
    ).resolves.toBeDefined();
  });

  it('answers diferentes produzem seeds diferentes → pelo menos 1 campo varia', async () => {
    const t = makeTemplate(stressNumberSchema());
    const out1 = await gen.generate(makeSession({ q: 'foo' }), t);
    const out2 = await gen.generate(makeSession({ q: 'bar' }), t);
    const allSame =
      out1.summary === out2.summary &&
      JSON.stringify(out1.risks) === JSON.stringify(out2.risks);
    expect(allSame).toBe(false);
  });
});

describe('Modo B — LLMMockInsightGenerator: garantias estruturais', () => {
  const gen = new LLMMockInsightGenerator();

  it('summary é sempre uma das 3 frases fixas', async () => {
    const validSummaries = new Set([
      'Análise inicial indica perfil compatível com o programa.',
      'Alguns pontos de atenção foram identificados para acompanhamento.',
      'Respostas sugerem boa adesão potencial com suporte adequado.',
    ]);
    // Testa com várias entradas para cobrir variações de hash
    const inputs = [
      {},
      { q: 1 },
      { q: 'abc' },
      { q: 10, r: 'x' },
      { a: 1, b: 2, c: 3 },
    ];
    for (const answers of inputs) {
      const out = await gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()));
      expect(validSummaries.has(out.summary)).toBe(true);
    }
  });

  it('número de recommendations é 1 ou 2 (nunca 0, nunca 3)', async () => {
    const inputs = [
      {},
      { q: 1 },
      { q: 5 },
      { q: 10 },
      { a: 'sim', b: 'não' },
    ];
    for (const answers of inputs) {
      const out = await gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()));
      expect(out.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(out.recommendations.length).toBeLessThanOrEqual(2);
    }
  });

  it('todas as recommendations são das 3 frases fixas do modo mock', async () => {
    const validRecs = new Set([
      'Manter comunicação regular com a equipe.',
      'Estabelecer metas semanais pequenas e alcançáveis.',
      'Registrar dúvidas e progressos no app.',
    ]);
    const inputs = [{}, { q: 1 }, { q: 10 }];
    for (const answers of inputs) {
      const out = await gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()));
      for (const rec of out.recommendations) {
        expect(validRecs.has(rec)).toBe(true);
      }
    }
  });

  it('risks: readiness está sempre na faixa [40, 90]', async () => {
    // clamp(40 + rng() * 50) → rng ∈ [0,1) → [40, 90)
    const inputs = [{}, { q: 1 }, { q: 5 }, { q: 10 }, { a: 'x' }];
    for (const answers of inputs) {
      const out = await gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()));
      expect(out.risks.readiness).toBeGreaterThanOrEqual(40);
      expect(out.risks.readiness).toBeLessThanOrEqual(90);
    }
  });

  it('risks: dropoutRisk está sempre na faixa [20, 60]', async () => {
    // clamp(20 + rng() * 40) → [20, 60)
    const inputs = [{}, { q: 1 }, { q: 5 }, { q: 10 }];
    for (const answers of inputs) {
      const out = await gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()));
      expect(out.risks.dropoutRisk).toBeGreaterThanOrEqual(20);
      expect(out.risks.dropoutRisk).toBeLessThanOrEqual(60);
    }
  });

  it('risks: stress está sempre na faixa [30, 80]', async () => {
    // clamp(30 + rng() * 50) → [30, 80)
    const inputs = [{}, { q: 1 }, { q: 5 }, { q: 10 }];
    for (const answers of inputs) {
      const out = await gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()));
      expect(out.risks.stress).toBeGreaterThanOrEqual(30);
      expect(out.risks.stress).toBeLessThanOrEqual(80);
    }
  });

  it('risks: sleepQuality está sempre na faixa [35, 90]', async () => {
    // clamp(35 + rng() * 55) → [35, 90)
    const inputs = [{}, { q: 1 }, { q: 5 }, { q: 10 }];
    for (const answers of inputs) {
      const out = await gen.generate(makeSession(answers), makeTemplate(stressNumberSchema()));
      expect(out.risks.sleepQuality).toBeGreaterThanOrEqual(35);
      expect(out.risks.sleepQuality).toBeLessThanOrEqual(90);
    }
  });

  it('todos os campos de risk derivam do mesmo seed RNG (comportamento de referência)', async () => {
    // Como rng() não avança estado, todos os 4 riscos partem da mesma chamada rng().
    // Isso significa que risk values são "correlacionados" — testamos que são consistentes.
    const answers = { qs: 5, extra: 'abc' };
    const t = makeTemplate(stressNumberSchema());
    const out = await gen.generate(makeSession(answers), t);
    // A correlação implica: se rng()=0.5, então todos seguem a mesma base.
    // Testamos que a relação entre readiness e stress é estável.
    const out2 = await gen.generate(makeSession(answers), t);
    expect(out.risks.readiness - out.risks.stress).toBe(out2.risks.readiness - out2.risks.stress);
  });
});

// ─── 4. COMPARAÇÃO DIRETA A vs B ─────────────────────────────────────────────
//
// Testes que executam ambos os geradores com a mesma entrada e verificam
// diferenças e semelhanças esperadas.

describe('Comparação direta A vs B com a mesma entrada', () => {
  const ruleGen = new RuleBasedInsightGenerator();
  const mockGen = new LLMMockInsightGenerator();

  it('mesma entrada → ambos retornam estrutura válida', async () => {
    const session = makeSession({ qs: 7, qsl: 4 });
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qs', text: 'Stress', type: 'number', required: true, tags: ['stress'] },
        { id: 'qsl', text: 'Sono', type: 'number', required: true, tags: ['sleep'] },
      ],
    };
    const t = makeTemplate(schema);
    const [outA, outB] = await Promise.all([ruleGen.generate(session, t), mockGen.generate(session, t)]);

    for (const out of [outA, outB]) {
      expect(typeof out.summary).toBe('string');
      expect(out.summary.length).toBeGreaterThan(0);
      expect(Object.keys(out.risks)).toHaveLength(4);
      expect(Array.isArray(out.recommendations)).toBe(true);
    }
  });

  it('Modo A produz scores baseados em respostas; Modo B ignora o schema', async () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qs', text: 'Stress', type: 'number', required: true, tags: ['stress'] },
      ],
    };
    const t = makeTemplate(schema);
    // Stress máximo para RuleBased → n=10
    const outA_high = await ruleGen.generate(makeSession({ qs: 10 }), t);
    const outA_low = await ruleGen.generate(makeSession({ qs: 1 }), t);

    // Modo A: stress muda com a resposta
    expect(outA_high.risks.stress).toBeGreaterThan(outA_low.risks.stress);

    // Modo B: stress é hash-based, não baseado no schema
    const outB_high = await mockGen.generate(makeSession({ qs: 10 }), t);
    const outB_low = await mockGen.generate(makeSession({ qs: 1 }), t);
    // Apenas verifica que B retorna valores válidos independente de qual
    expect(outB_high.risks.stress).toBeGreaterThanOrEqual(30);
    expect(outB_low.risks.stress).toBeGreaterThanOrEqual(30);
  });

  it('ambos os modos produzem saída JSON-serializável', async () => {
    const session = makeSession({ qs: 7 });
    const t = makeTemplate(stressNumberSchema());
    const [outA, outB] = await Promise.all([
      ruleGen.generate(session, t),
      mockGen.generate(session, t),
    ]);

    expect(() => JSON.stringify(outA)).not.toThrow();
    expect(() => JSON.stringify(outB)).not.toThrow();
  });

  it('Modo A respeita limiar de recomendação; Modo B usa frases fixas', async () => {
    const schema: TemplateSchemaJson = {
      questions: [
        { id: 'qs', text: 'Stress', type: 'number', required: true, tags: ['stress'] },
      ],
    };
    const t = makeTemplate(schema);
    // Stress alto no Modo A → recomendação específica de estresse
    const outA = await ruleGen.generate(makeSession({ qs: 10 }), t);
    const hasStressRec = outA.recommendations.some((r) => r.toLowerCase().includes('estresse'));
    expect(hasStressRec).toBe(true);

    // Modo B: recomendações são sempre das 3 frases fixas do mock
    const outB = await mockGen.generate(makeSession({ qs: 10 }), t);
    const mockPhrases = [
      'Manter comunicação regular com a equipe.',
      'Estabelecer metas semanais pequenas e alcançáveis.',
      'Registrar dúvidas e progressos no app.',
    ];
    for (const rec of outB.recommendations) {
      expect(mockPhrases).toContain(rec);
    }
  });
});
