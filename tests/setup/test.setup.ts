/**
 * Test setup utilities (TypeScript version)
 * Common setup functions for tests
 */

import { TestClient } from './test-client';

export interface SetupResult {
  client: TestClient;
}

/**
 * Setup test environment
 */
export async function setupTest(): Promise<SetupResult> {
  const client = new TestClient();

  // Check if server is running
  const isRunning = await client.isServerRunning();
  if (!isRunning) {
    throw new Error('⚠️  Serveur non démarré. Lancer: npm run dev');
  }

  return { client };
}

/**
 * Cleanup after tests
 */
export async function teardownTest(): Promise<void> {
  // Add cleanup logic if needed
  console.log('🧹 Test cleanup completed');
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await wait(delay * Math.pow(2, attempt - 1));
    }
  }
  throw new Error('Retry failed after max attempts'); // Should not be reached
}
