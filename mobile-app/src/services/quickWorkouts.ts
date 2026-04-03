export interface QuickWorkout {
  id: string;
  name: string;
  durationMin: number;
  level: 'iniciante' | 'intermediario' | 'avancado';
  equipment: 'sem equipamento' | 'halteres' | 'misto';
  focus: 'forca' | 'mobilidade' | 'cardio' | 'recuperacao';
  exercises: string[];
}

export const QUICK_WORKOUTS: QuickWorkout[] = [
  {
    id: 'qw-15-bodyweight',
    name: 'Express 15 min - Corpo Livre',
    durationMin: 15,
    level: 'iniciante',
    equipment: 'sem equipamento',
    focus: 'forca',
    exercises: ['Agachamento livre', 'Flexao inclinada', 'Prancha', 'Afundo alternado'],
  },
  {
    id: 'qw-20-mobility',
    name: 'Mobilidade 20 min',
    durationMin: 20,
    level: 'iniciante',
    equipment: 'sem equipamento',
    focus: 'mobilidade',
    exercises: ['Mobilidade de quadril', 'Alongamento peitoral', 'Rotacao toracica', 'Respiracao diafragmatica'],
  },
  {
    id: 'qw-30-dumbbell',
    name: 'Forca 30 min - Halteres',
    durationMin: 30,
    level: 'intermediario',
    equipment: 'halteres',
    focus: 'forca',
    exercises: ['Goblet squat', 'Remada unilateral', 'Supino com halteres', 'Levantamento romeno'],
  },
  {
    id: 'qw-12-recovery',
    name: 'Recuperacao ativa 12 min',
    durationMin: 12,
    level: 'iniciante',
    equipment: 'sem equipamento',
    focus: 'recuperacao',
    exercises: ['Caminhada leve', 'Mobilidade de tornozelo', 'Alongamento de posterior', 'Respiracao nasal'],
  },
];
