/**
 * Teste Unitário — Training Plan Schemas
 *
 * Valida o comportamento dos schemas Zod de forma isolada,
 * sem dependência de banco de dados ou servidor HTTP.
 */
import { describe, it, expect } from 'vitest';
import {
  createTrainingPlanSchema,
  updateTrainingPlanSchema,
  listTrainingPlansQuerySchema,
} from '@/modules/training-plans/schemas.js';

// ─── createTrainingPlanSchema ──────────────────────────────────────────────────

describe('Unit: createTrainingPlanSchema', () => {
  const validBase = {
    patientId: 'patient-id-123',
    name: 'Plano Full Body',
    planJson: { exercises: [{ name: 'Agachamento', sets: 3, reps: '12' }] },
    startDate: '2024-06-01',
  };

  it('aceita payload mínimo válido', () => {
    const result = createTrainingPlanSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('aceita payload completo com todos os campos opcionais', () => {
    const result = createTrainingPlanSchema.safeParse({
      ...validBase,
      description: 'Treino para iniciantes',
      endDate: '2024-08-01',
      active: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
      expect(result.data.description).toBe('Treino para iniciantes');
    }
  });

  it('aplica default active=true quando omitido', () => {
    const result = createTrainingPlanSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });

  it('rejeita patientId vazio', () => {
    const result = createTrainingPlanSchema.safeParse({ ...validBase, patientId: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita name vazio', () => {
    const result = createTrainingPlanSchema.safeParse({ ...validBase, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita name com mais de 255 caracteres', () => {
    const result = createTrainingPlanSchema.safeParse({
      ...validBase,
      name: 'A'.repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it('aceita name com exatamente 255 caracteres', () => {
    const result = createTrainingPlanSchema.safeParse({
      ...validBase,
      name: 'A'.repeat(255),
    });
    expect(result.success).toBe(true);
  });

  it('rejeita startDate vazio', () => {
    const result = createTrainingPlanSchema.safeParse({ ...validBase, startDate: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita planJson ausente (campo obrigatório)', () => {
    const { planJson: _planJson, ...withoutPlanJson } = validBase;
    const result = createTrainingPlanSchema.safeParse(withoutPlanJson);
    expect(result.success).toBe(false);
  });

  it('aceita planJson como objeto vazio {}', () => {
    const result = createTrainingPlanSchema.safeParse({ ...validBase, planJson: {} });
    expect(result.success).toBe(true);
  });

  it('aceita planJson com estrutura de days (novo formato)', () => {
    const result = createTrainingPlanSchema.safeParse({
      ...validBase,
      planJson: {
        template: 'beginner-fullbody',
        level: 'beginner',
        days: [
          {
            id: 'day-a',
            label: 'Dia A',
            focus: 'Full Body',
            exercises: [
              {
                id: 'squat',
                name: 'Agachamento',
                sets: 3,
                reps: '12',
                rest: '60s',
                muscleGroup: 'Quadríceps',
              },
            ],
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('endDate opcional pode ser omitido', () => {
    const result = createTrainingPlanSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endDate).toBeUndefined();
    }
  });

  it('description opcional pode ser omitida', () => {
    const result = createTrainingPlanSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });
});

// ─── updateTrainingPlanSchema ──────────────────────────────────────────────────

describe('Unit: updateTrainingPlanSchema', () => {
  it('aceita objeto vazio (todos os campos opcionais no update)', () => {
    const result = updateTrainingPlanSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('aceita atualização parcial apenas do nome', () => {
    const result = updateTrainingPlanSchema.safeParse({ name: 'Novo Nome' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Novo Nome');
    }
  });

  it('aceita atualização apenas do active', () => {
    const result = updateTrainingPlanSchema.safeParse({ active: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
    }
  });

  it('aceita atualização do planJson com novo formato de days', () => {
    const result = updateTrainingPlanSchema.safeParse({
      planJson: {
        template: 'intermediate-ppl',
        level: 'intermediate',
        days: [{ id: 'push', label: 'Push', focus: 'Peito', exercises: [] }],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejeita name vazio no update', () => {
    const result = updateTrainingPlanSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita name acima de 255 chars no update', () => {
    const result = updateTrainingPlanSchema.safeParse({ name: 'X'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejeita patientId vazio no update', () => {
    const result = updateTrainingPlanSchema.safeParse({ patientId: '' });
    expect(result.success).toBe(false);
  });
});

// ─── listTrainingPlansQuerySchema ──────────────────────────────────────────────

describe('Unit: listTrainingPlansQuerySchema', () => {
  it('aceita query vazia com valores padrão', () => {
    const result = listTrainingPlansQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('converte string "true" para booleano true no campo active', () => {
    const result = listTrainingPlansQuerySchema.safeParse({ active: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });

  it('converte string "false" para booleano false no campo active', () => {
    const result = listTrainingPlansQuerySchema.safeParse({ active: 'false' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
    }
  });

  it('aceita patientId como filtro opcional', () => {
    const result = listTrainingPlansQuerySchema.safeParse({ patientId: 'abc123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patientId).toBe('abc123');
    }
  });

  it('aceita name como filtro opcional', () => {
    const result = listTrainingPlansQuerySchema.safeParse({ name: 'hipertrofia' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('hipertrofia');
    }
  });

  it('aceita page e limit customizados', () => {
    const result = listTrainingPlansQuerySchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejeita page menor que 1', () => {
    const result = listTrainingPlansQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('rejeita limit maior que 100', () => {
    const result = listTrainingPlansQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });
});
