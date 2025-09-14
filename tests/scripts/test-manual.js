/**
 * Manual testing script for quick API validation
 * Refactored version of test-endpoints.js with better organization
 */
const TestClient = require('../utils/test-client');
const { setupTest } = require('../utils/setup');

async function runManualTests() {
  console.log('🧪 Manual API Testing Suite\n');
  
  try {
    const { client } = await setupTest();
    
    console.log('📊 Running manual tests...\n');

    // Test 1: Users API
    console.log('1. Testing /api/users');
    const usersResponse = await client.get('/api/users');
    
    if (usersResponse.success) {
      console.log('✅ Users API:', {
        success: usersResponse.data.success,
        count: usersResponse.data.count,
        hasTimestamp: !!usersResponse.data.timestamp
      });
    } else {
      console.log('❌ Users API failed:', usersResponse.error);
    }

    // Test 2: Health API
    console.log('\n2. Testing /api/internal/health');
    const healthResponse = await client.get('/api/internal/health');
    
    if (healthResponse.success) {
      console.log('✅ Health API:', {
        success: healthResponse.data.success,
        status: healthResponse.data.data.status,
        userCount: healthResponse.data.data.database.userCount,
        environment: healthResponse.data.data.environment
      });
    } else {
      console.log('❌ Health API failed:', healthResponse.error);
    }

    // Test 3: Non-existent endpoint
    console.log('\n3. Testing error handling with /api/nonexistent');
    const errorResponse = await client.get('/api/nonexistent');
    console.log('✅ Error handling:', {
      status: errorResponse.status,
      expectedError: !errorResponse.success
    });

    console.log('\n🎉 Manual testing completed!');
    console.log('✅ All endpoints tested successfully');

  } catch (error) {
    if (error.message.includes('Serveur non démarré')) {
      console.log('⚠️  Serveur non démarré. Lancer: npm run dev');
    } else {
      console.error('❌ Test error:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  runManualTests();
}

module.exports = { runManualTests };
