import '@testing-library/jest-dom/vitest';
import { vi, beforeAll, afterAll, expect } from 'vitest';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

// Mock global environment variables if needed
(process.env as any).NODE_ENV = 'test';

// Global test utilities
(global as any).testUtils = {
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  expectValidDate: (dateString: string) => {
    const date = new Date(dateString);
    expect(date.toString()).not.toBe('Invalid Date');
    expect(date.getTime()).toBeGreaterThan(0);
  },

  expectValidUUID: (uuid: string) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  },
};

// Simple Prisma Mock for unit tests
vi.mock('@/lib/core/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    // Add other models as needed
  },
}));
