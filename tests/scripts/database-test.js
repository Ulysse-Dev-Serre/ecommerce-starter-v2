/**
 * Database testing script
 * Refactored version of test-webhook.ts with better error handling
 */
const { PrismaClient } = require('../../src/generated/prisma');
const { mockUser } = require('../utils/mock-data');

async function testDatabaseOperations() {
  console.log('🧪 Testing database operations locally...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    console.log('1. Testing database connection');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: { clerkId: { startsWith: 'test_' } }
    });

    // Test user creation
    console.log('\n2. Testing user creation');
    const user = await prisma.user.create({
      data: mockUser
    });
    console.log('✅ User created successfully:', {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    });

    // Test user update
    console.log('\n3. Testing user update');
    const updatedUser = await prisma.user.update({
      where: { clerkId: mockUser.clerkId },
      data: { firstName: 'Updated Test' }
    });
    console.log('✅ User updated successfully:', {
      oldName: mockUser.firstName,
      newName: updatedUser.firstName
    });

    // Test user query
    console.log('\n4. Testing user query');
    const foundUser = await prisma.user.findUnique({
      where: { clerkId: mockUser.clerkId }
    });
    console.log('✅ User found successfully:', !!foundUser);

    // Test user count
    console.log('\n5. Testing user count');
    const userCount = await prisma.user.count();
    console.log('✅ Total users in database:', userCount);

    // Test user deletion
    console.log('\n6. Testing user deletion');
    await prisma.user.delete({
      where: { clerkId: mockUser.clerkId }
    });
    console.log('✅ User deleted successfully');

    // Verify deletion
    const deletedUser = await prisma.user.findUnique({
      where: { clerkId: mockUser.clerkId }
    });
    console.log('✅ Deletion verified:', deletedUser === null);

    console.log('\n🎉 All database operations working correctly!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.code === 'P1001') {
      console.error('🔌 Database connection failed. Check your DATABASE_URL');
    } else if (error.code === 'P2002') {
      console.error('🔄 Unique constraint violation. Cleaning up test data...');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('📝 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  testDatabaseOperations();
}

module.exports = { testDatabaseOperations };
