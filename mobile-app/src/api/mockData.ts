/**
 * Dados de exemplo para visualização no app quando o usuário está em modo demo (sem backend Andromeda).
 */

import type {
  TrainingPlanSummary,
  TrainingPlanDetail,
  DietPlanSummary,
  DietPlanDetail,
  ListMeta,
} from '../types';

const listMeta: ListMeta = {
  page: 1,
  limit: 50,
  total: 3,
  totalPages: 1,
  hasMore: false,
};

const startDate = new Date();
startDate.setDate(startDate.getDate() - 14);
const endDate = new Date();
endDate.setMonth(endDate.getMonth() + 2);

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

// ---- Treinos (3 exemplos) ----

export const MOCK_TRAINING_PLANS: TrainingPlanSummary[] = [
  {
    id: 'mock-treino-1',
    name: 'Força e hipertrofia (A/B/C)',
    description: 'Plano de 4x por semana. Foco em membros superiores e inferiores alternados. Ideal para ganho de massa muscular.',
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    active: true,
    executionsCount: 5,
  },
  {
    id: 'mock-treino-2',
    name: 'Resistência e core',
    description: 'Circuitos e estabilização para complementar o plano principal. Melhora condicionamento e postura.',
    startDate: formatDate(startDate),
    endDate: null,
    active: true,
    executionsCount: 2,
  },
  {
    id: 'mock-treino-3',
    name: 'Iniciante full body',
    description: 'Treino completo 3x na semana. Exercícios compostos para quem está começando.',
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    active: true,
    executionsCount: 8,
  },
];

// URLs de mídia para exercícios (fotos e GIFs). Em produção viriam do backend/Andromeda.
const MEDIA = {
  // GIFs de demonstração (movimento) — fontes públicas
  gifBench: 'https://media.giphy.com/media/26tknCqiJrBQG6Bu0/giphy.gif',
  gifSquat: 'https://media.giphy.com/media/13GIgrGdslD9oQ/giphy.gif',
  gifPullUp: 'https://media.giphy.com/media/3o7TKsQ82J2gGmNqGY/giphy.gif',
  gifPlank: 'https://media.giphy.com/media/xUOwG2s2fR1kzOePmE/giphy.gif',
  gifPushUp: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  gifRow: 'https://media.giphy.com/media/l0HlPwMAzhN2s2s2s/giphy.gif',
  gifCurl: 'https://media.giphy.com/media/3o7btPCcdwHzK6Q2co/giphy.gif',
  gifLegPress: 'https://media.giphy.com/media/3o7abKbpjQd2gMLbtq/giphy.gif',
  gifLateral: 'https://media.giphy.com/media/l0HlPwMAzhN2s2s2s/giphy.gif',
  // Imagem estática (placeholder quando não há GIF)
  imgPlaceholder: (label: string) =>
    `https://placehold.co/400x220/334155/94a3b8?text=${encodeURIComponent(label)}`,
};

const PLAN_JSON_FORCA: Record<string, unknown> = {
  days: [
    {
      dayLabel: 'Dia A — Peito e tríceps',
      exercises: [
        { name: 'Supino reto', sets: '4', reps: '8-10', rest: '90s', muscleGroup: 'Peito', gifUrl: MEDIA.gifBench, imageUrl: MEDIA.imgPlaceholder('Supino reto') },
        { name: 'Supino inclinado halter', sets: '3', reps: '10-12', rest: '60s', muscleGroup: 'Peito', imageUrl: MEDIA.imgPlaceholder('Supino inclinado') },
        { name: 'Crucifixo', sets: '3', reps: '12', rest: '45s', muscleGroup: 'Peito', imageUrl: MEDIA.imgPlaceholder('Crucifixo') },
        { name: 'Tríceps pulley', sets: '3', reps: '12-15', rest: '45s', muscleGroup: 'Tríceps', imageUrl: MEDIA.imgPlaceholder('Tríceps pulley') },
        { name: 'Tríceps francês', sets: '3', reps: '10-12', rest: '60s', muscleGroup: 'Tríceps', imageUrl: MEDIA.imgPlaceholder('Tríceps francês') },
      ],
    },
    {
      dayLabel: 'Dia B — Costas e bíceps',
      exercises: [
        { name: 'Barra fixa', sets: '4', reps: 'até a falha', rest: '90s', muscleGroup: 'Costas', gifUrl: MEDIA.gifPullUp, imageUrl: MEDIA.imgPlaceholder('Barra fixa') },
        { name: 'Remada curvada', sets: '4', reps: '8-10', rest: '90s', muscleGroup: 'Costas', gifUrl: MEDIA.gifRow, imageUrl: MEDIA.imgPlaceholder('Remada curvada') },
        { name: 'Puxada frontal', sets: '3', reps: '10-12', rest: '60s', muscleGroup: 'Costas', imageUrl: MEDIA.imgPlaceholder('Puxada frontal') },
        { name: 'Rosca direta', sets: '3', reps: '10-12', rest: '60s', muscleGroup: 'Bíceps', gifUrl: MEDIA.gifCurl, imageUrl: MEDIA.imgPlaceholder('Rosca direta') },
        { name: 'Rosca martelo', sets: '3', reps: '12', rest: '45s', muscleGroup: 'Bíceps', imageUrl: MEDIA.imgPlaceholder('Rosca martelo') },
      ],
    },
    {
      dayLabel: 'Dia C — Pernas e ombros',
      exercises: [
        { name: 'Agachamento livre', sets: '4', reps: '8-10', rest: '120s', muscleGroup: 'Pernas', gifUrl: MEDIA.gifSquat, imageUrl: MEDIA.imgPlaceholder('Agachamento') },
        { name: 'Leg press', sets: '3', reps: '12-15', rest: '90s', muscleGroup: 'Pernas', gifUrl: MEDIA.gifLegPress, imageUrl: MEDIA.imgPlaceholder('Leg press') },
        { name: 'Cadeira extensora', sets: '3', reps: '12', rest: '60s', muscleGroup: 'Pernas', imageUrl: MEDIA.imgPlaceholder('Cadeira extensora') },
        { name: 'Desenvolvimento barra', sets: '4', reps: '8-10', rest: '90s', muscleGroup: 'Ombros', imageUrl: MEDIA.imgPlaceholder('Desenvolvimento') },
        { name: 'Elevação lateral', sets: '3', reps: '12-15', rest: '45s', muscleGroup: 'Ombros', gifUrl: MEDIA.gifLateral, imageUrl: MEDIA.imgPlaceholder('Elevação lateral') },
      ],
    },
  ],
};

const PLAN_JSON_RESISTENCIA: Record<string, unknown> = {
  days: [
    {
      dayLabel: 'Circuito 1 — Corpo inteiro',
      exercises: [
        { name: 'Burpee', sets: '3', reps: '10', rest: '45s', muscleGroup: 'Full body', imageUrl: MEDIA.imgPlaceholder('Burpee') },
        { name: 'Mountain climber', sets: '3', reps: '20 (10 cada)', rest: '30s', muscleGroup: 'Core', imageUrl: MEDIA.imgPlaceholder('Mountain climber') },
        { name: 'Prancha abdominal', sets: '3', reps: '45s', rest: '30s', muscleGroup: 'Core', gifUrl: MEDIA.gifPlank, imageUrl: MEDIA.imgPlaceholder('Prancha') },
        { name: 'Agachamento bodyweight', sets: '3', reps: '15', rest: '45s', muscleGroup: 'Pernas', gifUrl: MEDIA.gifSquat, imageUrl: MEDIA.imgPlaceholder('Agachamento') },
        { name: 'Flexão', sets: '3', reps: '12-15', rest: '45s', muscleGroup: 'Peito', gifUrl: MEDIA.gifPushUp, imageUrl: MEDIA.imgPlaceholder('Flexão') },
      ],
    },
    {
      dayLabel: 'Circuito 2 — Core e estabilização',
      exercises: [
        { name: 'Prancha lateral', sets: '3', reps: '30s cada lado', rest: '20s', muscleGroup: 'Core', imageUrl: MEDIA.imgPlaceholder('Prancha lateral') },
        { name: 'Dead bug', sets: '3', reps: '12 cada lado', rest: '30s', muscleGroup: 'Core', imageUrl: MEDIA.imgPlaceholder('Dead bug') },
        { name: 'Ponte de glúteos', sets: '3', reps: '15', rest: '45s', muscleGroup: 'Pernas', imageUrl: MEDIA.imgPlaceholder('Ponte glúteos') },
        { name: 'Bird dog', sets: '3', reps: '10 cada lado', rest: '30s', muscleGroup: 'Core', imageUrl: MEDIA.imgPlaceholder('Bird dog') },
      ],
    },
  ],
};

const PLAN_JSON_INICIANTE: Record<string, unknown> = {
  days: [
    {
      dayLabel: 'Treino full body',
      exercises: [
        { name: 'Agachamento livre', sets: '3', reps: '10-12', rest: '90s', muscleGroup: 'Pernas', gifUrl: MEDIA.gifSquat, imageUrl: MEDIA.imgPlaceholder('Agachamento') },
        { name: 'Supino reto', sets: '3', reps: '10-12', rest: '90s', muscleGroup: 'Peito', gifUrl: MEDIA.gifBench, imageUrl: MEDIA.imgPlaceholder('Supino reto') },
        { name: 'Remada cavalinho', sets: '3', reps: '10-12', rest: '90s', muscleGroup: 'Costas', gifUrl: MEDIA.gifRow, imageUrl: MEDIA.imgPlaceholder('Remada') },
        { name: 'Desenvolvimento halter', sets: '3', reps: '10-12', rest: '60s', muscleGroup: 'Ombros', imageUrl: MEDIA.imgPlaceholder('Desenvolvimento') },
        { name: 'Leg press', sets: '3', reps: '12-15', rest: '75s', muscleGroup: 'Pernas', gifUrl: MEDIA.gifLegPress, imageUrl: MEDIA.imgPlaceholder('Leg press') },
        { name: 'Prancha', sets: '3', reps: '30s', rest: '30s', muscleGroup: 'Core', gifUrl: MEDIA.gifPlank, imageUrl: MEDIA.imgPlaceholder('Prancha') },
      ],
    },
  ],
};

const planJsonById: Record<string, Record<string, unknown>> = {
  'mock-treino-1': PLAN_JSON_FORCA,
  'mock-treino-2': PLAN_JSON_RESISTENCIA,
  'mock-treino-3': PLAN_JSON_INICIANTE,
};

export function getMockTrainingPlan(id: string): TrainingPlanDetail | null {
  const summary = MOCK_TRAINING_PLANS.find((p) => p.id === id);
  if (!summary) return null;
  const planJson = planJsonById[id] || PLAN_JSON_FORCA;
  return {
    ...summary,
    planJson,
  };
}

export function getMockTrainingPlansResponse(): { data: TrainingPlanSummary[]; meta: ListMeta } {
  return { data: MOCK_TRAINING_PLANS, meta: { ...listMeta, total: MOCK_TRAINING_PLANS.length } };
}

// ---- Dietas (3 exemplos) ----

export const MOCK_DIET_PLANS: DietPlanSummary[] = [
  {
    id: 'mock-dieta-1',
    name: 'Ganho de massa (alta proteína)',
    description: 'Dieta para ganho de massa magra. Calorias levemente acima do gasto e foco em proteína.',
    caloriesKcal: 2600,
    proteinG: 180,
    carbsG: 280,
    fatG: 85,
    waterMl: 3000,
    restrictions: ['Evitar açúcar refinado', 'Priorizar alimentos integrais', 'Refeições a cada 3h'],
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    active: true,
  },
  {
    id: 'mock-dieta-2',
    name: 'Manutenção e performance',
    description: 'Metas diárias para manter peso e energia para os treinos. Equilíbrio de macros.',
    caloriesKcal: 2200,
    proteinG: 150,
    carbsG: 240,
    fatG: 70,
    waterMl: 2500,
    restrictions: ['Lactose reduzida', 'Baixo sódio'],
    startDate: formatDate(startDate),
    endDate: null,
    active: true,
  },
  {
    id: 'mock-dieta-3',
    name: 'Emagrecimento saudável',
    description: 'Déficit calórico moderado com alta proteína para preservar massa magra.',
    caloriesKcal: 1800,
    proteinG: 140,
    carbsG: 160,
    fatG: 60,
    waterMl: 2500,
    restrictions: ['Sem frituras', 'Açúcar apenas em frutas', 'Álcool evitado'],
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    active: true,
  },
];

const MEAL_PLAN_1 = {
  meals: [
    { name: 'Café da manhã', time: '07:00', items: ['Ovos mexidos (2), aveia (40g), banana, café'] },
    { name: 'Lanche da manhã', time: '10:00', items: ['Whey ou iogurte natural + castanhas'] },
    { name: 'Almoço', time: '12:30', items: ['Arroz (150g), frango (150g), salada, feijão'] },
    { name: 'Pré-treino', time: '17:00', items: ['Whey ou banana + pasta de amendoim'] },
    { name: 'Jantar', time: '20:00', items: ['Batata-doce, carne magra, vegetais cozidos'] },
    { name: 'Ceia', time: '22:00', items: ['Queijo branco ou caseína'] },
  ],
};

const MEAL_PLAN_2 = {
  meals: [
    { name: 'Café da manhã', time: '07:00', items: ['Pão integral, ovos, fruta, café'] },
    { name: 'Almoço', time: '12:30', items: ['Arroz, proteína (frango/peixe), salada, leguminosas'] },
    { name: 'Lanche', time: '16:00', items: ['Iogurte ou sanduíche leve'] },
    { name: 'Jantar', time: '20:00', items: ['Carboidrato moderado, proteína, vegetais'] },
  ],
};

const MEAL_PLAN_3 = {
  meals: [
    { name: 'Café da manhã', time: '07:00', items: ['Ovos, aveia, fruta (porção controlada)'] },
    { name: 'Almoço', time: '12:00', items: ['Salada generosa, proteína magra, pouco arroz'] },
    { name: 'Lanche da tarde', time: '15:30', items: ['Fruta, chá, castanhas (porção pequena)'] },
    { name: 'Jantar', time: '19:30', items: ['Vegetais, peixe ou frango, sem carboidrato refinado'] },
  ],
};

const mealPlanById: Record<string, { meals: Array<{ name: string; time: string; items: string[] }> }> = {
  'mock-dieta-1': MEAL_PLAN_1,
  'mock-dieta-2': MEAL_PLAN_2,
  'mock-dieta-3': MEAL_PLAN_3,
};

export function getMockDietPlan(id: string): DietPlanDetail | null {
  const summary = MOCK_DIET_PLANS.find((p) => p.id === id);
  if (!summary) return null;
  const mealPlanJson = mealPlanById[id] || MEAL_PLAN_2;
  return {
    ...summary,
    mealPlanJson: mealPlanJson as unknown as Record<string, unknown> | null,
  };
}

export function getMockDietPlansResponse(): { data: DietPlanSummary[]; meta: ListMeta } {
  return { data: MOCK_DIET_PLANS, meta: { ...listMeta, total: MOCK_DIET_PLANS.length } };
}
