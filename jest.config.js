/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/unit/**/?(*.)+(spec|test).{js,ts}',
    '<rootDir>/tests/integration/**/?(*.)+(spec|test).{js,ts}',
    '<rootDir>/tests/e2e/**/?(*.)+(spec|test).{js,ts}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/generated/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
};

module.exports = config;
