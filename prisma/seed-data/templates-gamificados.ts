/**
 * Templates gamificados – versões simplificadas (máx. 10 perguntas cada).
 * Respostas estruturadas para insights assertivos.
 */

// ─── TEMPLATE 1: EMAGRECIMENTO ────────────────────────────────────────────────
export const templateEmagrecimento = {
  questions: [
    { id: 'obj_principal', text: 'Qual seu principal objetivo com o emagrecimento?', type: 'single', options: ['Melhorar saúde', 'Melhorar autoestima', 'Mais energia', 'Evento específico', 'Outro'], required: true, tags: ['goal'] },
    { id: 'peso_atual', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'peso_objetivo', text: 'Peso desejado (kg):', type: 'number', required: true, tags: ['goal'] },
    { id: 'altura', text: 'Altura (cm):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'atividade_fisica', text: 'Frequência de atividade física:', type: 'single', options: ['Não pratico', '1-2x/semana', '3-4x/semana', '5+ vezes/semana'], required: true, tags: ['lifestyle'] },
    { id: 'padrao_alimentar', text: 'Como descreveria seu padrão alimentar atual?', type: 'single', options: ['Muito irregular', 'Regular com escolhas não saudáveis', 'Regular com algumas saudáveis', 'Muito disciplinado'], required: true, tags: ['lifestyle'] },
    { id: 'nivel_estresse', text: 'Nível de estresse atual (1-10):', type: 'number', required: true, tags: ['stress'] },
    { id: 'qualidade_sono', text: 'Qualidade do sono (1-10):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'maior_desafio', text: 'Maior desafio para perder peso?', type: 'single', options: ['Falta de tempo', 'Ansiedade/estresse', 'Falta de motivação', 'Manter consistência', 'Outro'], required: true, tags: ['barriers'] },
    { id: 'sentimento_hoje', text: 'Como você está se sentindo hoje?', type: 'sentiment', required: true, tags: ['readiness'] },
  ],
  conditionalLogic: [],
  tags: ['weight_loss', 'gamified', 'goal', 'anthropometry', 'sleep', 'stress'],
};

// ─── TEMPLATE 2: GANHO DE MASSA MAGRA ─────────────────────────────────────────
export const templateGanhoMassa = {
  questions: [
    { id: 'obj_principal', text: 'Principal objetivo com ganho de massa?', type: 'single', options: ['Aumentar massa e força', 'Melhorar definição', 'Performance esportiva', 'Autoestima', 'Outro'], required: true, tags: ['goal'] },
    { id: 'peso_atual', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'altura', text: 'Altura (cm):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'peso_objetivo', text: 'Peso desejado (kg):', type: 'number', required: true, tags: ['goal'] },
    { id: 'frequencia_treino', text: 'Quantas vezes por semana treina?', type: 'single', options: ['3x', '4x', '5x', '6+'], required: true, tags: ['exercise'] },
    { id: 'refeicoes_dia', text: 'Quantas refeições por dia?', type: 'single', options: ['3', '4-5', '6+'], required: true, tags: ['nutrition'] },
    { id: 'horas_sono', text: 'Horas de sono por noite (média):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'qualidade_sono', text: 'Qualidade do sono (1-10):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'nivel_estresse', text: 'Nível de estresse (1-10):', type: 'number', required: true, tags: ['stress'] },
    { id: 'sentimento_hoje', text: 'Como você está se sentindo hoje?', type: 'sentiment', required: true, tags: ['readiness'] },
  ],
  conditionalLogic: [],
  tags: ['muscle_gain', 'gamified', 'goal', 'anthropometry', 'sleep', 'stress'],
};

// ─── TEMPLATE 3: MELHORIA DE SAÚDE ────────────────────────────────────────────
export const templateMelhoriaSaude = {
  questions: [
    { id: 'obj_principal', text: 'Principal objetivo com a melhoria da saúde?', type: 'single', options: ['Prevenir doenças', 'Mais energia', 'Qualidade de vida', 'Controlar condições', 'Outro'], required: true, tags: ['goal'] },
    { id: 'peso_atual', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'altura', text: 'Altura (cm):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'autoavaliacao_saude', text: 'Como avalia sua saúde geral (1-10):', type: 'number', required: true, tags: ['health'] },
    { id: 'nivel_energia', text: 'Nível de energia ao longo do dia (1-10):', type: 'number', required: true, tags: ['energy'] },
    { id: 'atividade_fisica', text: 'Frequência de atividade física:', type: 'single', options: ['Não pratico', '1-2x/semana', '3-4x/semana', '5+ vezes/semana'], required: true, tags: ['lifestyle'] },
    { id: 'qualidade_sono', text: 'Qualidade do sono (1-10):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'nivel_estresse', text: 'Nível de estresse (1-10):', type: 'number', required: true, tags: ['stress'] },
    { id: 'condicoes_saude', text: 'Tem condição de saúde diagnosticada?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['health'] },
    { id: 'sentimento_hoje', text: 'Como você está se sentindo hoje?', type: 'sentiment', required: true, tags: ['readiness'] },
  ],
  conditionalLogic: [],
  tags: ['health_improvement', 'gamified', 'goal', 'anthropometry', 'sleep', 'stress'],
};

// ─── TEMPLATE 4: MANTER BOM CORPO ────────────────────────────────────────────
export const templateManterBomCorpo = {
  questions: [
    { id: 'peso_atual', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'altura', text: 'Altura (cm):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'satisfacao_corpo', text: 'Satisfação com o corpo atual (1-10):', type: 'number', required: true, tags: ['satisfaction'] },
    { id: 'frequencia_treino', text: 'Quantas vezes por semana treina?', type: 'single', options: ['3x', '4x', '5x', '6+'], required: true, tags: ['exercise'] },
    { id: 'disciplina_alimentar', text: 'Como avalia sua disciplina alimentar?', type: 'single', options: ['Muito disciplinado', 'Maioria das vezes', 'Regular', 'Preciso melhorar'], required: true, tags: ['nutrition'] },
    { id: 'horas_sono', text: 'Horas de sono por noite (média):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'qualidade_sono', text: 'Qualidade do sono (1-10):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'nivel_energia', text: 'Nível de energia (1-10):', type: 'number', required: true, tags: ['energy'] },
    { id: 'nivel_estresse', text: 'Nível de estresse (1-10):', type: 'number', required: true, tags: ['stress'] },
    { id: 'sentimento_hoje', text: 'Como você está se sentindo hoje?', type: 'sentiment', required: true, tags: ['readiness'] },
  ],
  conditionalLogic: [],
  tags: ['maintenance', 'gamified', 'anthropometry', 'sleep', 'stress'],
};
