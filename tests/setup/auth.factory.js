/**
 * Auth factory for tests
 * Creates test users with different roles
 */

const { prisma } = require('./db.setup');

/**
 * Create a test admin user
 */
async function createAdminUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `admin-${Date.now()}@test.com`,
      name: 'Test Admin',
      role: 'ADMIN',
      ...overrides,
    },
  });
}

/**
 * Create a test regular user
 */
async function createRegularUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `user-${Date.now()}@test.com`,
      name: 'Test User',
      role: 'USER',
      ...overrides,
    },
  });
}

/**
 * Generate auth headers for a user (mock authentication)
 */
function getAuthHeaders(userId, role = 'USER') {
  // TODO: Implement based on your auth strategy
  // This is a placeholder for JWT or session-based auth
  return {
    'x-user-id': userId,
    'x-user-role': role,
  };
}

module.exports = {
  createAdminUser,
  createRegularUser,
  getAuthHeaders,
};
