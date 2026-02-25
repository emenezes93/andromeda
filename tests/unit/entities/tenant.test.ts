import { describe, it, expect } from 'vitest';
import { Tenant } from '@domain/entities/Tenant.js';

describe('Tenant entity', () => {
  describe('Tenant.create()', () => {
    it('sets name and defaults', () => {
      const t = Tenant.create('Clínica Saúde');
      expect(t.name).toBe('Clínica Saúde');
      expect(t.status).toBe('active');
      expect(t.planTier).toBe('free');
      expect(t.id).toBe('');
      expect(t.deletedAt).toBeNull();
    });

    it('sets createdAt to now', () => {
      const before = new Date();
      const t = Tenant.create('Test');
      expect(t.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('isActive()', () => {
    it('returns true for active, non-deleted tenant', () => {
      const t = new Tenant('t1', 'Name', 'active', new Date(), null, 'free');
      expect(t.isActive()).toBe(true);
    });

    it('returns false for suspended tenant', () => {
      const t = new Tenant('t1', 'Name', 'suspended', new Date(), null, 'free');
      expect(t.isActive()).toBe(false);
    });

    it('returns false for deleted tenant even if status is active', () => {
      const t = new Tenant('t1', 'Name', 'active', new Date(), new Date(), 'free');
      expect(t.isActive()).toBe(false);
    });
  });

  describe('isDeleted()', () => {
    it('returns false when deletedAt is null', () => {
      const t = Tenant.create('Test');
      expect(t.isDeleted()).toBe(false);
    });

    it('returns true when deletedAt is set', () => {
      const t = new Tenant('t1', 'Name', 'active', new Date(), new Date(), 'free');
      expect(t.isDeleted()).toBe(true);
    });
  });

  describe('suspend()', () => {
    it('returns new Tenant with status suspended', () => {
      const t = Tenant.create('Test');
      const suspended = t.suspend();
      expect(suspended.status).toBe('suspended');
    });

    it('preserves all other fields', () => {
      const t = new Tenant('id-1', 'My Clinic', 'active', new Date('2023-01-01'), null, 'pro');
      const s = t.suspend();
      expect(s.id).toBe('id-1');
      expect(s.name).toBe('My Clinic');
      expect(s.planTier).toBe('pro');
    });

    it('does not mutate the original tenant', () => {
      const t = Tenant.create('Test');
      t.suspend();
      expect(t.status).toBe('active');
    });
  });

  describe('activate()', () => {
    it('returns new Tenant with status active', () => {
      const t = new Tenant('t1', 'Name', 'suspended', new Date(), null, 'free');
      expect(t.activate().status).toBe('active');
    });

    it('does not mutate the original', () => {
      const t = new Tenant('t1', 'Name', 'suspended', new Date(), null, 'free');
      t.activate();
      expect(t.status).toBe('suspended');
    });
  });
});
