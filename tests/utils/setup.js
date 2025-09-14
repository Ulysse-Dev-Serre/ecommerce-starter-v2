/**
 * Test setup utilities
 * Common setup functions for tests
 */

const TestClient = require('./test-client');

/**
 * Setup test environment
 */
async function setupTest() {
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
async function teardownTest() {
  // Add cleanup logic if needed
  console.log('🧹 Test cleanup completed');
}

/**
 * Wait for a specified amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await wait(delay * Math.pow(2, attempt - 1));
    }
  }
}

module.exports = {
  setupTest,
  teardownTest,
  wait,
  retry
};
