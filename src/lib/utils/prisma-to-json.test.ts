import { describe, it, expect } from 'vitest';
import { prismaToJson } from './prisma-to-json';

describe('Prisma To JSON Utils', () => {
  it('should clone simple objects', () => {
    const obj = { foo: 'bar', num: 123 };
    const result = prismaToJson(obj);
    expect(result).toEqual(obj);
    expect(result).not.toBe(obj); // Different reference
  });

  it('should serialize dates to strings', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const obj = { date };
    const result = prismaToJson(obj);
    expect(result.date).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should handle nested objects', () => {
    const obj = { nested: { val: 1 } };
    const result = prismaToJson(obj);
    expect(result).toEqual(obj);
  });
});
