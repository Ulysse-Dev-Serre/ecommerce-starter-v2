/**
 * Test script pour envoyer des webhooks au serveur debug
 */
const TestClient = require('../utils/test-client');
const { mockClerkWebhookPayload } = require('../utils/mock-data');

async function testWebhookServer() {
  console.log('🧪 Testing webhook debug server...\n');
  
  const client = new TestClient('http://localhost:3001');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint');
    const healthResponse = await client.get('/health');
    
    if (healthResponse.success) {
      console.log('✅ Health endpoint:', healthResponse.data);
    } else {
      console.log('❌ Health endpoint failed');
      return;
    }
    
    // Test 2: Send webhook
    console.log('\n2. Sending test webhook');
    const webhookResponse = await client.post('/test-webhook', mockClerkWebhookPayload, {
      headers: {
        'svix-id': 'msg_test123',
        'svix-signature': 'v1,test-signature',
        'svix-timestamp': '1640995200'
      }
    });
    
    if (webhookResponse.success) {
      console.log('✅ Webhook sent successfully:', webhookResponse.data);
    } else {
      console.log('❌ Webhook failed:', webhookResponse.error);
    }
    
    console.log('\n🎉 Webhook testing completed!');
    console.log('📝 Check the webhook server terminal for detailed logs');
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️  Webhook server not running. Start it with: npm run test:webhook');
    } else {
      console.error('❌ Test error:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  testWebhookServer();
}

module.exports = { testWebhookServer };
