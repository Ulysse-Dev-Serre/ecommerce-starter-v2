/**
 * Auth factory for tests
 * Creates test users with different roles and generates Clerk auth headers
 */

const { prisma } = require('./db.setup');

/**
 * Real admin credentials for testing
 */
const REAL_ADMIN = {
  id: 'cmhry6nwv0000ks0c2t1g2gnv',
  clerkId: 'user_35FXh55upbdX9L0zj1bjnrFCAde',
  email: 'ulyssebo255@gmail.com',
  firstName: 'Ulysse',
  role: 'ADMIN'
};

/**
 * Create a test admin user
 */
async function createAdminUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `admin-${Date.now()}@test.com`,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      ...overrides,
    },
  });
}

/**
 * Create a test regular user (CLIENT role)
 */
async function createRegularUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `user-${Date.now()}@test.com`,
      clerkId: `test_client_${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      role: 'CLIENT',
      ...overrides,
    },
  });
}

/**
 * Get or create a persistent test client user for 403 tests
 */
async function getOrCreateTestClientUser() {
  const testClerkId = 'test_client_user_for_403_tests';
  
  let user = await prisma.user.findUnique({
    where: { clerkId: testClerkId },
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test-client@test.com',
        clerkId: testClerkId,
        firstName: 'Test',
        lastName: 'Client',
        role: 'CLIENT',
      },
    });
  }
  
  return user;
}

/**
 * Generate test auth headers using TEST_API_KEY
 * 
 * ⚠️ IMPORTANT: Nécessite la variable d'environnement TEST_API_KEY
 * 
 * Cette fonction génère les headers nécessaires pour bypasser l'authentification
 * Clerk dans les tests d'intégration. Le serveur vérifie le header x-test-api-key
 * et authentifie automatiquement l'utilisateur admin réel.
 * 
 * Voir: src/lib/middleware/withAuth.ts pour la logique de bypass
 */
function getTestAuthHeaders() {
  if (!process.env.TEST_API_KEY) {
    throw new Error(
      '❌ TEST_API_KEY non définie.\n' +
      'Ajoutez TEST_API_KEY=votre-clé-secrète dans .env.local'
    );
  }
  
  return {
    'x-test-api-key': process.env.TEST_API_KEY,
  };
}

/**
 * @deprecated Utiliser getTestAuthHeaders() à la place
 */
function getAdminAuthHeaders() {
  return getTestAuthHeaders();
}

/**
 * Generate test auth headers for a CLIENT user (non-admin)
 * Used for testing 403 Forbidden responses on admin routes
 * 
 * @param {string} clerkId - The clerkId of the client user to simulate
 */
function getClientAuthHeaders(clerkId = 'test_client_user_for_403_tests') {
  if (!process.env.TEST_API_KEY) {
    throw new Error(
      '❌ TEST_API_KEY non définie.\n' +
      'Ajoutez TEST_API_KEY=votre-clé-secrète dans .env.local'
    );
  }
  
  return {
    'x-test-api-key': process.env.TEST_API_KEY,
    'x-test-user-id': clerkId,
  };
}

/**
 * Get real admin info
 */
function getRealAdmin() {
  return REAL_ADMIN;
}

module.exports = {
  createAdminUser,
  createRegularUser,
  getOrCreateTestClientUser,
  getTestAuthHeaders,
  getClientAuthHeaders,
  getAdminAuthHeaders, // deprecated
  getRealAdmin,
  REAL_ADMIN,
};
