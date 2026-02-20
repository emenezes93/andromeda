/**
 * Templates fitness – versões simplificadas (máx. 10 perguntas cada).
 * Respostas estruturadas para insights assertivos.
 */

// ─── PAR-Q (Physical Activity Readiness Questionnaire) ─────────────────────
export const templateParQ = {
  questions: [
    { id: 'parq_1', text: 'Algum médico já disse que você tem problema cardíaco e que só deve fazer atividade física recomendada por médico?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['parq', 'heart'] },
    { id: 'parq_2', text: 'Você sente dor no peito quando pratica atividade física?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['parq', 'heart'] },
    { id: 'parq_3', text: 'Nos últimos 30 dias, sentiu dor no peito quando NÃO estava praticando atividade física?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['parq', 'heart'] },
    { id: 'parq_4', text: 'Você perde o equilíbrio por tontura ou já perdeu a consciência?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['parq'] },
    { id: 'parq_5', text: 'Tem problema ósseo ou articular que poderia piorar com atividade física?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['parq'] },
    { id: 'parq_6', text: 'Algum médico receita medicamentos para sua pressão ou condição cardíaca?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['parq'] },
    { id: 'parq_7', text: 'Conhece algum outro motivo pelo qual não deveria praticar atividade física?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['parq'] },
  ],
  conditionalLogic: [],
  tags: ['parq', 'fitness', 'readiness'],
};

// ─── Anamnese Postural Inicial ─────────────────────────────────────────────
export const templateAnamnesePostural = {
  questions: [
    { id: 'post_dores', text: 'Você sente dores em alguma região do corpo?', type: 'single', options: ['Não', 'Sim, ocasionalmente', 'Sim, frequentemente'], required: true, tags: ['postural', 'pain'] },
    { id: 'post_regioes', text: 'Quais regiões?', type: 'multiple', options: ['Pescoço', 'Ombros', 'Coluna lombar', 'Coluna torácica', 'Quadril', 'Joelhos', 'Outra'], required: false, tags: ['postural'], showWhen: { questionId: 'post_dores', operator: 'in', value: ['Sim, ocasionalmente', 'Sim, frequentemente'] } },
    { id: 'post_lesoes', text: 'Já teve lesões musculares, articulares ou ósseas?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['postural', 'injury'] },
    { id: 'post_cirurgias', text: 'Já fez alguma cirurgia?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['postural', 'surgery'] },
    { id: 'post_postura_trabalho', text: 'Sua postura no trabalho/estudo é:', type: 'single', options: ['Principalmente sentado', 'Principalmente em pé', 'Alterno', 'Movimento constante'], required: true, tags: ['postural'] },
    { id: 'post_atividade', text: 'Pratica atividade física atualmente?', type: 'single', options: ['Não', 'Sim, 1-2x/semana', 'Sim, 3-4x/semana', 'Sim, 5+ vezes/semana'], required: true, tags: ['postural'] },
    { id: 'post_disposicao', text: 'Disposição para atividades hoje (1-10):', type: 'number', required: true, tags: ['readiness'] },
    { id: 'post_sentimento', text: 'Como você está se sentindo hoje?', type: 'sentiment', required: true, tags: ['readiness'] },
  ],
  conditionalLogic: [{ ifQuestion: 'post_dores', ifValue: ['Sim, ocasionalmente', 'Sim, frequentemente'], thenShow: ['post_regioes'] }],
  tags: ['postural', 'fitness', 'pain', 'injury'],
};

// ─── Check-in Semanal ──────────────────────────────────────────────────────
export const templateCheckinSemanal = {
  questions: [
    { id: 'check_sono', text: 'Qualidade do sono esta semana (1-10):', type: 'number', required: true, tags: ['checkin', 'sleep'] },
    { id: 'check_horas_sono', text: 'Média de horas de sono por noite:', type: 'number', required: true, tags: ['checkin', 'sleep'] },
    { id: 'check_estresse', text: 'Nível de estresse esta semana (1-10):', type: 'number', required: true, tags: ['checkin', 'stress'] },
    { id: 'check_disposicao', text: 'Disposição para treinar (1-10):', type: 'number', required: true, tags: ['checkin', 'readiness'] },
    { id: 'check_dores', text: 'Dores musculares ou cansaço excessivo?', type: 'single', options: ['Não', 'Leve', 'Moderado', 'Forte'], required: true, tags: ['checkin', 'pain'] },
    { id: 'check_aderencia', text: 'Conseguiu seguir o plano de treinos?', type: 'single', options: ['100%', 'Maior parte', 'Metade', 'Pouco', 'Não treinei'], required: true, tags: ['checkin', 'adherence'] },
    { id: 'check_alimentacao', text: 'Como avalia sua alimentação esta semana?', type: 'single', options: ['Muito boa', 'Boa', 'Regular', 'Ruim'], required: true, tags: ['checkin', 'nutrition'] },
    { id: 'check_sentimento', text: 'Como você está se sentindo esta semana?', type: 'sentiment', required: true, tags: ['checkin', 'readiness'] },
  ],
  conditionalLogic: [],
  tags: ['checkin', 'weekly', 'sleep', 'stress', 'readiness'],
};

// ─── Avaliação Nutricional Básica ───────────────────────────────────────────
export const templateAvaliacaoNutricional = {
  questions: [
    { id: 'nut_refeicoes_dia', text: 'Quantas refeições você faz por dia?', type: 'single', options: ['1-2', '3', '4', '5', '6 ou mais'], required: true, tags: ['nutrition', 'meals'] },
    { id: 'nut_cafe', text: 'Toma café da manhã regularmente?', type: 'single', options: ['Não', 'Às vezes', 'Sim, sempre'], required: true, tags: ['nutrition'] },
    { id: 'nut_agua', text: 'Quantos litros de água bebe por dia (média)?', type: 'number', required: true, tags: ['nutrition', 'hydration'] },
    { id: 'nut_frutas_vegetais', text: 'Porções de frutas e/ou vegetais por dia:', type: 'single', options: ['Nenhuma ou quase nenhuma', '1-2 porções', '3-4 porções', '5+ porções'], required: true, tags: ['nutrition'] },
    { id: 'nut_proteina', text: 'Consome proteína em todas as refeições principais?', type: 'single', options: ['Não', 'Às vezes', 'Sim, na maioria'], required: true, tags: ['nutrition'] },
    { id: 'nut_processados', text: 'Frequência de ultraprocessados (salgadinhos, refrigerante):', type: 'single', options: ['Quase nunca', '1-2x/semana', '3-5x/semana', 'Quase todo dia'], required: true, tags: ['nutrition'] },
    { id: 'nut_alcool', text: 'Frequência de bebidas alcoólicas:', type: 'single', options: ['Não consumo', 'Raramente', '1-2x/semana', '3+ vezes/semana'], required: true, tags: ['nutrition'] },
    { id: 'nut_restricoes', text: 'Tem restrição alimentar, alergia ou intolerância?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['nutrition'] },
    { id: 'nut_suplementos', text: 'Usa suplementos alimentares?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['nutrition'] },
    { id: 'nut_sentimento', text: 'Como você está se sentindo em relação à alimentação?', type: 'sentiment', required: true, tags: ['nutrition', 'readiness'] },
  ],
  conditionalLogic: [],
  tags: ['nutrition', 'fitness', 'habits'],
};

// ─── Reavaliação 90 dias ───────────────────────────────────────────────────
export const templateReavaliacao90 = {
  questions: [
    { id: 'rea_peso_atual', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['reassessment', 'anthropometry'] },
    { id: 'rea_cintura', text: 'Circunferência da cintura (cm):', type: 'number', required: false, tags: ['reassessment', 'anthropometry'] },
    { id: 'rea_quadril', text: 'Circunferência do quadril (cm):', type: 'number', required: false, tags: ['reassessment', 'anthropometry'] },
    { id: 'rea_satisfacao', text: 'Como avalia sua evolução nos últimos 90 dias? (1-10)', type: 'number', required: true, tags: ['reassessment', 'satisfaction'] },
    { id: 'rea_objetivo_atingido', text: 'Sente que está progredindo em direção ao objetivo?', type: 'single', options: ['Sim, muito', 'Sim, um pouco', 'Estável', 'Não, regredindo'], required: true, tags: ['reassessment', 'goal'] },
    { id: 'rea_aderencia', text: 'Conseguiu seguir o plano (treino + nutrição)?', type: 'single', options: ['100%', 'Maior parte', 'Metade', 'Pouco'], required: true, tags: ['reassessment', 'adherence'] },
    { id: 'rea_sentimento', text: 'Como você está se sentindo em relação aos resultados?', type: 'sentiment', required: true, tags: ['reassessment', 'readiness'] },
  ],
  conditionalLogic: [],
  tags: ['reassessment', '90days', 'anthropometry', 'progress'],
};
