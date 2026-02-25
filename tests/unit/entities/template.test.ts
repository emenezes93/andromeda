import { describe, it, expect } from 'vitest';
import { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';

const makeTemplate = (overrides: {
  schemaJson?: unknown;
  deletedAt?: Date | null;
} = {}) =>
  new AnamnesisTemplate(
    'tpl-1',
    't-1',
    'Anamnese Inicial',
    1,
    overrides.schemaJson !== undefined
      ? overrides.schemaJson
      : { questions: [{ id: 'q1', text: 'Q1', type: 'text', required: true }] },
    null,
    null,
    new Date('2024-01-01'),
    overrides.deletedAt !== undefined ? overrides.deletedAt : null,
  );

describe('AnamnesisTemplate entity', () => {
  describe('isActive()', () => {
    it('returns true when deletedAt is null', () => {
      expect(makeTemplate().isActive()).toBe(true);
    });

    it('returns false when deletedAt is set', () => {
      expect(makeTemplate({ deletedAt: new Date() }).isActive()).toBe(false);
    });
  });

  describe('isDeleted()', () => {
    it('returns false when deletedAt is null', () => {
      expect(makeTemplate().isDeleted()).toBe(false);
    });

    it('returns true when deletedAt is set', () => {
      expect(makeTemplate({ deletedAt: new Date() }).isDeleted()).toBe(true);
    });
  });

  describe('hasConditionalLogic()', () => {
    it('returns false when schemaJson has no conditionalLogic', () => {
      expect(makeTemplate().hasConditionalLogic()).toBe(false);
    });

    it('returns false when conditionalLogic is an empty array', () => {
      const schema = { questions: [], conditionalLogic: [] };
      expect(makeTemplate({ schemaJson: schema }).hasConditionalLogic()).toBe(false);
    });

    it('returns true when conditionalLogic has at least one rule', () => {
      const schema = {
        questions: [],
        conditionalLogic: [{ ifQuestion: 'q1', ifValue: 'sim', thenShow: ['q2'] }],
      };
      expect(makeTemplate({ schemaJson: schema }).hasConditionalLogic()).toBe(true);
    });

    it('returns false when schemaJson is null', () => {
      expect(makeTemplate({ schemaJson: null }).hasConditionalLogic()).toBe(false);
    });

    it('returns false when schemaJson is not an object', () => {
      expect(makeTemplate({ schemaJson: 'string' }).hasConditionalLogic()).toBe(false);
      expect(makeTemplate({ schemaJson: 42 }).hasConditionalLogic()).toBe(false);
    });

    it('returns false when conditionalLogic is not an array', () => {
      const schema = { questions: [], conditionalLogic: 'not-array' };
      expect(makeTemplate({ schemaJson: schema }).hasConditionalLogic()).toBe(false);
    });
  });
});
