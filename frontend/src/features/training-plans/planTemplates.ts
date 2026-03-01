// ---------------------------------------------------------------------------
// Training plan templates — Iniciante · Intermediário · Avançado
// ---------------------------------------------------------------------------

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscleGroup: string;
  tip?: string;
}

export interface TrainingDay {
  id: string;
  label: string;
  focus: string;
  exercises: ExerciseItem[];
}

export interface SelectedExercise extends ExerciseItem {
  checked: boolean;
}

export interface SelectedDay {
  id: string;
  label: string;
  focus: string;
  exercises: SelectedExercise[];
  isOpen: boolean;
}

export interface PlanTemplate {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  emoji: string;
  name: string;
  tagline: string;
  subtitle: string;
  frequency: string;
  weeks: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBg: string;
  days: TrainingDay[];
}

export function templateToSelectedDays(template: PlanTemplate): SelectedDay[] {
  return template.days.map((day) => ({
    ...day,
    isOpen: true,
    exercises: day.exercises.map((ex) => ({ ...ex, checked: true })),
  }));
}

// ---------------------------------------------------------------------------
// Iniciante — Full Body 3×/semana
// ---------------------------------------------------------------------------

const BEGINNER: PlanTemplate = {
  id: 'beginner-fullbody',
  level: 'beginner',
  emoji: '🌱',
  name: 'Iniciante',
  tagline: 'Full Body 3×/semana',
  subtitle: 'Ideal para quem está começando. Movimentos básicos e volume acessível.',
  frequency: '3 dias/semana',
  weeks: '4–6 semanas',
  bgClass: 'bg-success-light',
  textClass: 'text-success',
  borderClass: 'border-success/40',
  badgeBg: 'bg-success text-white',
  days: [
    {
      id: 'beg-day-a',
      label: 'Dia A',
      focus: 'Full Body',
      exercises: [
        {
          id: 'beg-squat',
          name: 'Agachamento',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Quadríceps / Glúteo',
        },
        {
          id: 'beg-db-bench',
          name: 'Supino com Halteres',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Peito',
        },
        {
          id: 'beg-bent-row',
          name: 'Remada Curvada',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Costas',
        },
        {
          id: 'beg-db-shoulder',
          name: 'Desenvolvimento com Halteres',
          sets: 3,
          reps: '10',
          rest: '60s',
          muscleGroup: 'Ombro',
        },
        {
          id: 'beg-plank',
          name: 'Prancha',
          sets: 3,
          reps: '30s',
          rest: '45s',
          muscleGroup: 'Core',
          tip: 'Mantenha o abdômen contraído e o corpo alinhado',
        },
      ],
    },
    {
      id: 'beg-day-b',
      label: 'Dia B',
      focus: 'Full Body',
      exercises: [
        {
          id: 'beg-lunge',
          name: 'Afundo',
          sets: 3,
          reps: '10 cada',
          rest: '60s',
          muscleGroup: 'Quadríceps / Glúteo',
        },
        {
          id: 'beg-pushup',
          name: 'Flexão de Braço',
          sets: 3,
          reps: '10–15',
          rest: '60s',
          muscleGroup: 'Peito',
          tip: 'Joelhos no chão se necessário',
        },
        {
          id: 'beg-lat-pull',
          name: 'Puxada na Máquina',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Costas',
        },
        {
          id: 'beg-lat-raise',
          name: 'Elevação Lateral',
          sets: 3,
          reps: '12',
          rest: '45s',
          muscleGroup: 'Ombro',
        },
        {
          id: 'beg-crunch',
          name: 'Abdominal Crunch',
          sets: 3,
          reps: '20',
          rest: '45s',
          muscleGroup: 'Core',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Intermediário — Push / Pull / Legs
// ---------------------------------------------------------------------------

const INTERMEDIATE: PlanTemplate = {
  id: 'intermediate-ppl',
  level: 'intermediate',
  emoji: '⚡',
  name: 'Intermediário',
  tagline: 'Push / Pull / Legs',
  subtitle: 'Para quem já treina há 3–6 meses. Divisão por grupos musculares.',
  frequency: '3 dias/semana',
  weeks: '8–12 semanas',
  bgClass: 'bg-primary-subtle',
  textClass: 'text-primary',
  borderClass: 'border-primary/40',
  badgeBg: 'bg-primary text-white',
  days: [
    {
      id: 'int-push',
      label: 'Empurrar — Push',
      focus: 'Peito · Ombro · Tríceps',
      exercises: [
        {
          id: 'int-barbell-bench',
          name: 'Supino Reto Barra',
          sets: 4,
          reps: '10',
          rest: '90s',
          muscleGroup: 'Peito',
        },
        {
          id: 'int-incline-db',
          name: 'Supino Inclinado Haltere',
          sets: 3,
          reps: '12',
          rest: '75s',
          muscleGroup: 'Peito',
        },
        {
          id: 'int-ohp',
          name: 'Desenvolvimento Militar',
          sets: 3,
          reps: '10',
          rest: '90s',
          muscleGroup: 'Ombro',
        },
        {
          id: 'int-lat-raise',
          name: 'Elevação Lateral',
          sets: 3,
          reps: '15',
          rest: '60s',
          muscleGroup: 'Ombro',
        },
        {
          id: 'int-tri-rope',
          name: 'Tríceps Corda',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Tríceps',
        },
        {
          id: 'int-skull-crush',
          name: 'Tríceps Francês',
          sets: 3,
          reps: '10',
          rest: '60s',
          muscleGroup: 'Tríceps',
        },
      ],
    },
    {
      id: 'int-pull',
      label: 'Puxar — Pull',
      focus: 'Costas · Bíceps · Ombro Posterior',
      exercises: [
        {
          id: 'int-pulldown',
          name: 'Puxada Frente Barra Larga',
          sets: 4,
          reps: '8',
          rest: '90s',
          muscleGroup: 'Costas',
        },
        {
          id: 'int-barbell-row',
          name: 'Remada Curvada Barra',
          sets: 4,
          reps: '10',
          rest: '90s',
          muscleGroup: 'Costas',
        },
        {
          id: 'int-single-row',
          name: 'Remada Unilateral',
          sets: 3,
          reps: '12',
          rest: '75s',
          muscleGroup: 'Costas',
        },
        {
          id: 'int-face-pull',
          name: 'Face Pull',
          sets: 3,
          reps: '15',
          rest: '60s',
          muscleGroup: 'Ombro Posterior',
        },
        {
          id: 'int-barbell-curl',
          name: 'Rosca Direta Barra',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Bíceps',
        },
        {
          id: 'int-hammer-curl',
          name: 'Rosca Martelo',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Bíceps',
        },
      ],
    },
    {
      id: 'int-legs',
      label: 'Pernas — Legs',
      focus: 'Quadríceps · Posterior · Panturrilha',
      exercises: [
        {
          id: 'int-back-squat',
          name: 'Agachamento Livre',
          sets: 4,
          reps: '8',
          rest: '2min',
          muscleGroup: 'Quadríceps',
        },
        {
          id: 'int-leg-press',
          name: 'Leg Press 45°',
          sets: 4,
          reps: '12',
          rest: '90s',
          muscleGroup: 'Quadríceps / Glúteo',
        },
        {
          id: 'int-leg-ext',
          name: 'Cadeira Extensora',
          sets: 3,
          reps: '15',
          rest: '60s',
          muscleGroup: 'Quadríceps',
        },
        {
          id: 'int-leg-curl',
          name: 'Leg Curl Deitado',
          sets: 3,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Posterior',
        },
        {
          id: 'int-stiff',
          name: 'Stiff',
          sets: 3,
          reps: '10',
          rest: '75s',
          muscleGroup: 'Posterior / Glúteo',
        },
        {
          id: 'int-calf',
          name: 'Panturrilha em Pé',
          sets: 4,
          reps: '15',
          rest: '60s',
          muscleGroup: 'Panturrilha',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Avançado — Upper / Lower 4×/semana
// ---------------------------------------------------------------------------

const ADVANCED: PlanTemplate = {
  id: 'advanced-upper-lower',
  level: 'advanced',
  emoji: '🔥',
  name: 'Avançado',
  tagline: 'Upper / Lower 4×/semana',
  subtitle: 'Para atletas com mais de 1 ano de treino. Alta intensidade e volume.',
  frequency: '4 dias/semana',
  weeks: '12+ semanas',
  bgClass: 'bg-warning-light',
  textClass: 'text-warning',
  borderClass: 'border-warning/40',
  badgeBg: 'bg-warning text-white',
  days: [
    {
      id: 'adv-upper-a',
      label: 'Upper A — Força',
      focus: 'Peito · Costas · Ombro · Braços',
      exercises: [
        {
          id: 'adv-bench',
          name: 'Supino Reto Barra',
          sets: 5,
          reps: '5',
          rest: '3min',
          muscleGroup: 'Peito',
        },
        {
          id: 'adv-row',
          name: 'Remada Barra Pronada',
          sets: 5,
          reps: '5',
          rest: '3min',
          muscleGroup: 'Costas',
        },
        {
          id: 'adv-ohp',
          name: 'Desenvolvimento Militar Barra',
          sets: 4,
          reps: '6',
          rest: '2min',
          muscleGroup: 'Ombro',
        },
        {
          id: 'adv-weighted-pullup',
          name: 'Barra Fixa com Lastro',
          sets: 4,
          reps: '6',
          rest: '2min',
          muscleGroup: 'Costas',
          tip: 'Use cinto de lastro para progressão',
        },
        {
          id: 'adv-curl',
          name: 'Rosca Direta Barra',
          sets: 3,
          reps: '10',
          rest: '75s',
          muscleGroup: 'Bíceps',
        },
        {
          id: 'adv-skull',
          name: 'Tríceps Testa',
          sets: 3,
          reps: '10',
          rest: '75s',
          muscleGroup: 'Tríceps',
        },
      ],
    },
    {
      id: 'adv-lower-a',
      label: 'Lower A — Força',
      focus: 'Quadríceps · Posterior · Core',
      exercises: [
        {
          id: 'adv-squat',
          name: 'Agachamento Livre',
          sets: 5,
          reps: '5',
          rest: '3min',
          muscleGroup: 'Quadríceps',
        },
        {
          id: 'adv-rdl',
          name: 'Levantamento Terra Romeno',
          sets: 4,
          reps: '5',
          rest: '3min',
          muscleGroup: 'Posterior / Glúteo',
        },
        {
          id: 'adv-bulgarian',
          name: 'Bulgarian Split Squat',
          sets: 3,
          reps: '8 cada',
          rest: '90s',
          muscleGroup: 'Quadríceps / Glúteo',
        },
        {
          id: 'adv-leg-curl-a',
          name: 'Leg Curl Deitado',
          sets: 4,
          reps: '10',
          rest: '75s',
          muscleGroup: 'Posterior',
        },
        {
          id: 'adv-calf-a',
          name: 'Panturrilha em Pé',
          sets: 5,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Panturrilha',
        },
      ],
    },
    {
      id: 'adv-upper-b',
      label: 'Upper B — Volume',
      focus: 'Peito · Costas · Ombro · Braços',
      exercises: [
        {
          id: 'adv-incline',
          name: 'Supino Inclinado Haltere',
          sets: 4,
          reps: '10',
          rest: '90s',
          muscleGroup: 'Peito',
        },
        {
          id: 'adv-seated-row',
          name: 'Remada Sentada na Polia',
          sets: 4,
          reps: '12',
          rest: '90s',
          muscleGroup: 'Costas',
        },
        {
          id: 'adv-fly',
          name: 'Crucifixo Inclinado',
          sets: 3,
          reps: '12',
          rest: '75s',
          muscleGroup: 'Peito',
        },
        {
          id: 'adv-pulldown',
          name: 'Puxada Supinada',
          sets: 3,
          reps: '12',
          rest: '75s',
          muscleGroup: 'Costas',
        },
        {
          id: 'adv-face-pull',
          name: 'Face Pull',
          sets: 4,
          reps: '15',
          rest: '60s',
          muscleGroup: 'Ombro Posterior',
        },
        {
          id: 'adv-lat-raise',
          name: 'Elevação Lateral',
          sets: 4,
          reps: '15',
          rest: '60s',
          muscleGroup: 'Ombro',
        },
      ],
    },
    {
      id: 'adv-lower-b',
      label: 'Lower B — Volume',
      focus: 'Quadríceps · Posterior · Glúteo',
      exercises: [
        {
          id: 'adv-hack',
          name: 'Hack Squat',
          sets: 4,
          reps: '12',
          rest: '90s',
          muscleGroup: 'Quadríceps',
        },
        {
          id: 'adv-leg-press',
          name: 'Leg Press 45°',
          sets: 4,
          reps: '15',
          rest: '75s',
          muscleGroup: 'Quadríceps / Glúteo',
        },
        {
          id: 'adv-leg-ext',
          name: 'Cadeira Extensora',
          sets: 4,
          reps: '15',
          rest: '60s',
          muscleGroup: 'Quadríceps',
        },
        {
          id: 'adv-leg-curl-b',
          name: 'Cadeira Flexora',
          sets: 4,
          reps: '12',
          rest: '60s',
          muscleGroup: 'Posterior',
        },
        {
          id: 'adv-hip-thrust',
          name: 'Hip Thrust',
          sets: 4,
          reps: '12',
          rest: '75s',
          muscleGroup: 'Glúteo',
        },
        {
          id: 'adv-stiff',
          name: 'Stiff com Halteres',
          sets: 3,
          reps: '12',
          rest: '75s',
          muscleGroup: 'Posterior',
        },
      ],
    },
  ],
};

export const PLAN_TEMPLATES: PlanTemplate[] = [BEGINNER, INTERMEDIATE, ADVANCED];
