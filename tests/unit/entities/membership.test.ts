import { describe, it, expect } from 'vitest';
import { Membership } from '@domain/entities/Membership.js';
import type { Role } from '@domain/entities/Membership.js';

describe('Membership entity', () => {
  describe('Membership.create()', () => {
    it('sets userId, tenantId, role and defaults active to true', () => {
      const m = Membership.create('u1', 't1', 'admin');
      expect(m.userId).toBe('u1');
      expect(m.tenantId).toBe('t1');
      expect(m.role).toBe('admin');
      expect(m.active).toBe(true);
      expect(m.id).toBe('');
    });

    it('allows active to be explicitly set to false', () => {
      const m = Membership.create('u1', 't1', 'viewer', false);
      expect(m.active).toBe(false);
    });
  });

  describe('hasMinimumRole()', () => {
    const cases: Array<[Role, Role, boolean]> = [
      // owner satisfies all
      ['owner', 'owner', true],
      ['owner', 'admin', true],
      ['owner', 'practitioner', true],
      ['owner', 'viewer', true],
      // admin
      ['admin', 'owner', false],
      ['admin', 'admin', true],
      ['admin', 'practitioner', true],
      ['admin', 'viewer', true],
      // practitioner
      ['practitioner', 'owner', false],
      ['practitioner', 'admin', false],
      ['practitioner', 'practitioner', true],
      ['practitioner', 'viewer', true],
      // viewer
      ['viewer', 'owner', false],
      ['viewer', 'admin', false],
      ['viewer', 'practitioner', false],
      ['viewer', 'viewer', true],
    ];

    it.each(cases)(
      'role=%s, required=%s → %s',
      (role, required, expected) => {
        const m = Membership.create('u', 't', role);
        expect(m.hasMinimumRole(required)).toBe(expected);
      }
    );
  });
});
