import { describe, it, expect } from 'vitest';
import { paginate, skipFor, paginationQuerySchema, MAX_LIMIT } from '@shared/utils/pagination.js';

describe('MAX_LIMIT', () => {
  it('is 100', () => {
    expect(MAX_LIMIT).toBe(100);
  });
});

describe('paginate()', () => {
  it('passes data through unchanged', () => {
    const items = [{ id: 1 }, { id: 2 }];
    expect(paginate(items, 10, 1, 5).data).toBe(items);
  });

  it('includes correct meta fields', () => {
    const result = paginate(['a', 'b'], 10, 2, 5);
    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(5);
    expect(result.meta.total).toBe(10);
  });

  it('calculates totalPages correctly', () => {
    expect(paginate([], 100, 1, 20).meta.totalPages).toBe(5);
    expect(paginate([], 21, 1, 20).meta.totalPages).toBe(2);
    expect(paginate([], 20, 1, 20).meta.totalPages).toBe(1);
    expect(paginate([], 1, 1, 20).meta.totalPages).toBe(1);
  });

  it('sets totalPages to 1 when total is 0', () => {
    expect(paginate([], 0, 1, 20).meta.totalPages).toBe(1);
  });

  it('hasMore is true when not on the last page', () => {
    expect(paginate([], 100, 1, 20).meta.hasMore).toBe(true);
    expect(paginate([], 100, 4, 20).meta.hasMore).toBe(true);
  });

  it('hasMore is false on the last page', () => {
    expect(paginate([], 100, 5, 20).meta.hasMore).toBe(false);
  });

  it('hasMore is false when total is 0', () => {
    expect(paginate([], 0, 1, 20).meta.hasMore).toBe(false);
  });

  it('hasMore is false when exactly one page of data', () => {
    expect(paginate([], 20, 1, 20).meta.hasMore).toBe(false);
  });

  it('works with page 1 and single item', () => {
    const result = paginate(['x'], 1, 1, 10);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasMore).toBe(false);
  });
});

describe('skipFor()', () => {
  it('returns 0 for page 1', () => {
    expect(skipFor(1, 20)).toBe(0);
    expect(skipFor(1, 100)).toBe(0);
  });

  it('calculates correct offsets', () => {
    expect(skipFor(2, 20)).toBe(20);
    expect(skipFor(3, 20)).toBe(40);
    expect(skipFor(5, 10)).toBe(40);
    expect(skipFor(10, 5)).toBe(45);
  });
});

describe('paginationQuerySchema', () => {
  it('defaults page to 1 and limit to 20', () => {
    const result = paginationQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('coerces string numbers', () => {
    const result = paginationQuerySchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('passes valid values through', () => {
    const result = paginationQuerySchema.parse({ page: 2, limit: 100 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(100);
  });

  it('rejects limit > 100', () => {
    expect(() => paginationQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it('rejects page < 1', () => {
    expect(() => paginationQuerySchema.parse({ page: 0 })).toThrow();
  });

  it('rejects limit < 1', () => {
    expect(() => paginationQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it('rejects non-integer page', () => {
    expect(() => paginationQuerySchema.parse({ page: 1.5 })).toThrow();
  });
});
