/**
 * Database setup utilities for tests
 * Handles database seeding and reset operations
 */

const { PrismaClient } = require('../../src/generated/prisma');

const prisma = new PrismaClient();

/**
 * Clean database between tests
 */
async function cleanDatabase() {
  const tables = [
    'CartItem',
    'Cart',
    'OrderItem',
    'Order',
    'ProductVariant',
    'Product',
    'AttributeValue',
    'Attribute',
    'User',
  ];

  for (const table of tables) {
    try {
      await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany();
    } catch (error) {
      console.warn(`⚠️  Could not clean table ${table}:`, error.message);
    }
  }
}

/**
 * Seed database with test data
 */
async function seedTestData() {
  // Add common test data here if needed
  // For example: create default categories, attributes, etc.
}

/**
 * Reset database to initial state
 */
async function resetDatabase() {
  await cleanDatabase();
  await seedTestData();
}

module.exports = {
  prisma,
  cleanDatabase,
  seedTestData,
  resetDatabase,
};
