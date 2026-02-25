import { describe, it, expect } from 'vitest';
import { Patient } from '@domain/entities/Patient.js';

const makePatient = (overrides: {
  birthDate?: Date | null;
  deletedAt?: Date | null;
} = {}) =>
  new Patient(
    'p-1',
    't-1',
    'Ana Costa',
    overrides.birthDate !== undefined ? overrides.birthDate : new Date('1990-06-15'),
    'female',
    '123.456.789-00',
    'ana@example.com',
    '11999999999',
    'Nutricionista',
    'Perder peso',
    'Dores nas costas',
    'Notas diversas',
    'v1',
    new Date('2023-01-01'),
    null,
    new Date('2023-01-01'),
    new Date('2023-01-01'),
    overrides.deletedAt !== undefined ? overrides.deletedAt : null,
  );

describe('Patient entity', () => {
  describe('Patient.create()', () => {
    it('sets tenantId and fullName', () => {
      const p = Patient.create({ tenantId: 't1', fullName: 'Carlos Lima' });
      expect(p.tenantId).toBe('t1');
      expect(p.fullName).toBe('Carlos Lima');
    });

    it('defaults all optional fields to null', () => {
      const p = Patient.create({ tenantId: 't1', fullName: 'Test' });
      expect(p.birthDate).toBeNull();
      expect(p.gender).toBeNull();
      expect(p.cpf).toBeNull();
      expect(p.email).toBeNull();
      expect(p.phone).toBeNull();
      expect(p.profession).toBeNull();
      expect(p.mainGoal).toBeNull();
      expect(p.mainComplaint).toBeNull();
      expect(p.notes).toBeNull();
      expect(p.userId).toBeNull();
    });

    it('sets id to empty string', () => {
      expect(Patient.create({ tenantId: 't1', fullName: 'T' }).id).toBe('');
    });

    it('sets deletedAt to null', () => {
      expect(Patient.create({ tenantId: 't1', fullName: 'T' }).deletedAt).toBeNull();
    });
  });

  describe('isDeleted()', () => {
    it('returns false when deletedAt is null', () => {
      expect(makePatient().isDeleted()).toBe(false);
    });

    it('returns true when deletedAt is set', () => {
      expect(makePatient({ deletedAt: new Date() }).isDeleted()).toBe(true);
    });
  });

  describe('isAdult()', () => {
    it('returns false when birthDate is null', () => {
      expect(makePatient({ birthDate: null }).isAdult()).toBe(false);
    });

    it('returns true for someone clearly over 18', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      expect(makePatient({ birthDate }).isAdult()).toBe(true);
    });

    it('returns false for someone clearly under 18', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10);
      expect(makePatient({ birthDate }).isAdult()).toBe(false);
    });

    it('returns true on exact 18th birthday', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);
      expect(makePatient({ birthDate }).isAdult()).toBe(true);
    });

    it('returns false one day before 18th birthday', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);
      birthDate.setDate(birthDate.getDate() + 1); // one day into the future
      expect(makePatient({ birthDate }).isAdult()).toBe(false);
    });
  });
});
