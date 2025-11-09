/**
 * Jest setup file
 * Global configuration for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase test timeout for slow database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error, // Keep error for debugging
  };
}

// Global test utilities
global.testUtils = {
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

  expectValidDate: dateString => {
    const date = new Date(dateString);
    expect(date.toString()).not.toBe('Invalid Date');
    expect(date.getTime()).toBeGreaterThan(0);
  },

  expectValidUUID: uuid => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  },
};

// Clean up after all tests
afterAll(async () => {
  // Add global cleanup if needed
  if (global.testPrismaClient) {
    await global.testPrismaClient.$disconnect();
  }
});
