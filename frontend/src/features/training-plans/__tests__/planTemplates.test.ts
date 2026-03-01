/**
 * Teste Unitário (Frontend) — planTemplates.ts
 *
 * Testa as funções puras e a integridade dos templates de treino.
 * Sem dependência de DOM, API ou estado React.
 */
import { describe, it, expect } from 'vitest';
import { PLAN_TEMPLATES, templateToSelectedDays } from '../planTemplates';

const beginner = PLAN_TEMPLATES.find((t) => t.level === 'beginner')!;
const intermediate = PLAN_TEMPLATES.find((t) => t.level === 'intermediate')!;
const advanced = PLAN_TEMPLATES.find((t) => t.level === 'advanced')!;

// ─── Integridade dos templates ────────────────────────────────────────────────

describe('Unit: PLAN_TEMPLATES — integridade dos dados', () => {
  it('exporta exatamente 3 templates', () => {
    expect(PLAN_TEMPLATES).toHaveLength(3);
  });

  it('cada template tem os campos obrigatórios preenchidos', () => {
    PLAN_TEMPLATES.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.level).toBeTruthy();
      expect(t.emoji).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.tagline).toBeTruthy();
      expect(t.subtitle).toBeTruthy();
      expect(t.frequency).toBeTruthy();
      expect(t.weeks).toBeTruthy();
      expect(t.bgClass).toBeTruthy();
      expect(t.textClass).toBeTruthy();
      expect(t.borderClass).toBeTruthy();
      expect(t.badgeBg).toBeTruthy();
      expect(Array.isArray(t.days)).toBe(true);
    });
  });

  it('cada template tem pelo menos um dia de treino', () => {
    PLAN_TEMPLATES.forEach((t) => {
      expect(t.days.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('cada dia tem pelo menos um exercício', () => {
    PLAN_TEMPLATES.forEach((t) => {
      t.days.forEach((d) => {
        expect(d.exercises.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it('IDs de exercícios são únicos dentro de cada template', () => {
    PLAN_TEMPLATES.forEach((t) => {
      const allIds = t.days.flatMap((d) => d.exercises.map((e) => e.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  it('IDs de templates são únicos entre si', () => {
    const ids = PLAN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada exercício tem sets >= 1 e campos de texto não vazios', () => {
    PLAN_TEMPLATES.forEach((t) => {
      t.days.forEach((d) => {
        d.exercises.forEach((ex) => {
          expect(ex.sets).toBeGreaterThanOrEqual(1);
          expect(ex.reps.trim()).not.toBe('');
          expect(ex.rest.trim()).not.toBe('');
          expect(ex.muscleGroup.trim()).not.toBe('');
        });
      });
    });
  });

  it('os três níveis estão presentes: beginner, intermediate, advanced', () => {
    const levels = PLAN_TEMPLATES.map((t) => t.level);
    expect(levels).toContain('beginner');
    expect(levels).toContain('intermediate');
    expect(levels).toContain('advanced');
  });
});

// ─── Template Iniciante ───────────────────────────────────────────────────────

describe('Unit: Template Iniciante (beginner)', () => {
  it('template existe', () => expect(beginner).toBeDefined());
  it('emoji é 🌱', () => expect(beginner.emoji).toBe('🌱'));
  it('tem 2 dias de treino', () => expect(beginner.days).toHaveLength(2));
  it('frequência menciona 3 dias', () => expect(beginner.frequency).toContain('3'));

  it('Dia A tem 5 exercícios', () => {
    const dayA = beginner.days.find((d) => d.id === 'beg-day-a');
    expect(dayA?.exercises).toHaveLength(5);
  });

  it('Dia B tem 5 exercícios', () => {
    const dayB = beginner.days.find((d) => d.id === 'beg-day-b');
    expect(dayB?.exercises).toHaveLength(5);
  });

  it('exercícios do iniciante têm no máximo 3 séries (volume baixo)', () => {
    beginner.days.forEach((d) => {
      d.exercises.forEach((ex) => {
        expect(ex.sets).toBeLessThanOrEqual(3);
      });
    });
  });

  it('tem exercício com dica (tip)', () => {
    const allExercises = beginner.days.flatMap((d) => d.exercises);
    const hasTip = allExercises.some((e) => !!e.tip);
    expect(hasTip).toBe(true);
  });
});

// ─── Template Intermediário ───────────────────────────────────────────────────

describe('Unit: Template Intermediário (intermediate)', () => {
  it('template existe', () => expect(intermediate).toBeDefined());
  it('emoji é ⚡', () => expect(intermediate.emoji).toBe('⚡'));
  it('tem 3 dias (Push, Pull, Legs)', () => expect(intermediate.days).toHaveLength(3));

  it('dias têm os IDs corretos', () => {
    const ids = intermediate.days.map((d) => d.id);
    expect(ids).toContain('int-push');
    expect(ids).toContain('int-pull');
    expect(ids).toContain('int-legs');
  });

  it('dia Push tem foco em Peito e Tríceps', () => {
    const push = intermediate.days.find((d) => d.id === 'int-push')!;
    expect(push.focus).toContain('Peito');
    expect(push.focus).toContain('Tríceps');
  });

  it('tem exercícios com 4 séries (volume maior que iniciante)', () => {
    const allSets = intermediate.days.flatMap((d) => d.exercises.map((e) => e.sets));
    expect(allSets.some((s) => s >= 4)).toBe(true);
  });

  it('total de exercícios é maior que no template iniciante', () => {
    const intermTotal = intermediate.days.flatMap((d) => d.exercises).length;
    const begTotal = beginner.days.flatMap((d) => d.exercises).length;
    expect(intermTotal).toBeGreaterThan(begTotal);
  });
});

// ─── Template Avançado ────────────────────────────────────────────────────────

describe('Unit: Template Avançado (advanced)', () => {
  it('template existe', () => expect(advanced).toBeDefined());
  it('emoji é 🔥', () => expect(advanced.emoji).toBe('🔥'));
  it('tem 4 dias (Upper A, Lower A, Upper B, Lower B)', () => expect(advanced.days).toHaveLength(4));

  it('dias têm os IDs corretos', () => {
    const ids = advanced.days.map((d) => d.id);
    expect(ids).toContain('adv-upper-a');
    expect(ids).toContain('adv-lower-a');
    expect(ids).toContain('adv-upper-b');
    expect(ids).toContain('adv-lower-b');
  });

  it('tem exercícios com 5 séries (trabalho de força)', () => {
    const allSets = advanced.days.flatMap((d) => d.exercises.map((e) => e.sets));
    expect(allSets.some((s) => s === 5)).toBe(true);
  });

  it('Upper A tem tempo de descanso longo (3min)', () => {
    const upperA = advanced.days.find((d) => d.id === 'adv-upper-a')!;
    const hasLongRest = upperA.exercises.some((e) => e.rest.includes('3'));
    expect(hasLongRest).toBe(true);
  });

  it('tem exercício com dica (tip) para avançados', () => {
    const allExercises = advanced.days.flatMap((d) => d.exercises);
    expect(allExercises.some((e) => !!e.tip)).toBe(true);
  });
});

// ─── templateToSelectedDays() ─────────────────────────────────────────────────

describe('Unit: templateToSelectedDays()', () => {
  it('retorna o mesmo número de dias do template', () => {
    PLAN_TEMPLATES.forEach((t) => {
      expect(templateToSelectedDays(t)).toHaveLength(t.days.length);
    });
  });

  it('todos os exercícios são pré-selecionados (checked = true)', () => {
    PLAN_TEMPLATES.forEach((t) => {
      templateToSelectedDays(t).forEach((day) => {
        day.exercises.forEach((ex) => {
          expect(ex.checked).toBe(true);
        });
      });
    });
  });

  it('todos os dias começam abertos (isOpen = true)', () => {
    PLAN_TEMPLATES.forEach((t) => {
      templateToSelectedDays(t).forEach((day) => {
        expect(day.isOpen).toBe(true);
      });
    });
  });

  it('mantém id, label, focus e exercícios do template original', () => {
    const selected = templateToSelectedDays(beginner);
    beginner.days.forEach((origDay, di) => {
      expect(selected[di].id).toBe(origDay.id);
      expect(selected[di].label).toBe(origDay.label);
      expect(selected[di].focus).toBe(origDay.focus);
      origDay.exercises.forEach((origEx, ei) => {
        expect(selected[di].exercises[ei].id).toBe(origEx.id);
        expect(selected[di].exercises[ei].name).toBe(origEx.name);
        expect(selected[di].exercises[ei].sets).toBe(origEx.sets);
        expect(selected[di].exercises[ei].reps).toBe(origEx.reps);
        expect(selected[di].exercises[ei].rest).toBe(origEx.rest);
      });
    });
  });

  it('não modifica o template original (sem mutação)', () => {
    const originalDays = JSON.parse(JSON.stringify(beginner.days));
    templateToSelectedDays(beginner);
    expect(beginner.days).toEqual(originalDays);
    // exercícios originais não têm checked
    expect((beginner.days[0].exercises[0] as unknown as Record<string, unknown>)['checked']).toBeUndefined();
  });

  it('total de exercícios selecionados = total de exercícios do template', () => {
    PLAN_TEMPLATES.forEach((t) => {
      const origTotal = t.days.flatMap((d) => d.exercises).length;
      const selTotal = templateToSelectedDays(t)
        .flatMap((d) => d.exercises)
        .filter((e) => e.checked).length;
      expect(selTotal).toBe(origTotal);
    });
  });
});
