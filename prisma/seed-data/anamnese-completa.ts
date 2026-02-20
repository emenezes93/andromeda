/**
 * Anamnese Completa – versão simplificada (máx. 10 perguntas).
 * Respostas estruturadas (número, single, sentiment) para insights mais assertivos.
 */
export const anamneseCompletaSchema = {
  questions: [
    { id: 'objetivo_principal', text: 'Objetivo principal:', type: 'single', options: ['Emagrecimento', 'Ganho de massa', 'Condicionamento', 'Saúde e qualidade de vida', 'Outro'], required: true, tags: ['goal'] },
    { id: 'peso_kg', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'altura_cm', text: 'Altura (cm):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'nivel_atividade', text: 'Nível de atividade física:', type: 'single', options: ['Sedentário', 'Levemente ativo (1-2x/semana)', 'Moderadamente ativo (3-4x/semana)', 'Muito ativo (5+ vezes/semana)'], required: true, tags: ['activity'] },
    { id: 'horas_sono', text: 'Horas de sono por noite (média):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'qualidade_sono', text: 'Qualidade do sono (1-10):', type: 'number', required: true, tags: ['sleep'] },
    { id: 'nivel_estresse', text: 'Nível de estresse (1-10):', type: 'number', required: true, tags: ['stress'] },
    { id: 'come_emocao', text: 'Come por ansiedade ou emoção?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'], required: true, tags: ['food_emotional'] },
    { id: 'medicamentos', text: 'Toma medicamento contínuo?', type: 'single', options: ['Não', 'Sim'], required: true, tags: [] },
    { id: 'condicoes_saude', text: 'Condição de saúde que devemos saber?', type: 'single', options: ['Não', 'Sim'], required: true, tags: ['health'] },
  ],
  conditionalLogic: [],
  tags: ['goal', 'anthropometry', 'activity', 'sleep', 'stress', 'food_emotional', 'health'],
} as const;
