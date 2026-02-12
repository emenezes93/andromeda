import { describe, it, expect } from 'vitest';
import { getRequestHash, getIdempotencyKey } from '@shared/utils/idempotency.js';

describe('getRequestHash', () => {
  it('produces same hash for same method, url and body', () => {
    const req1 = { method: 'POST', url: '/v1/foo', body: { a: 1, b: 2 } } as any;
    const req2 = { method: 'POST', url: '/v1/foo', body: { b: 2, a: 1 } } as any;
    expect(getRequestHash(req1)).toBe(getRequestHash(req2));
  });

  it('produces different hash for different body', () => {
    const req1 = { method: 'POST', url: '/v1/foo', body: { a: 1 } } as any;
    const req2 = { method: 'POST', url: '/v1/foo', body: { a: 2 } } as any;
    expect(getRequestHash(req1)).not.toBe(getRequestHash(req2));
  });
});

describe('getIdempotencyKey', () => {
  it('returns header value when present', () => {
    const req = { headers: { 'idempotency-key': 'my-key' } } as any;
    expect(getIdempotencyKey(req)).toBe('my-key');
  });

  it('returns undefined when absent', () => {
    const req = { headers: {} } as any;
    expect(getIdempotencyKey(req)).toBeUndefined();
  });
});
