/**
 * Webhook debugging server
 * Refactored version of debug-webhook.js with enhanced logging
 * Uses native Node.js HTTP module instead of Express
 */
const http = require('http');
const url = require('url');

/**
 * Parse JSON from request body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        resolve(body);
      }
    });
    
    req.on('error', reject);
  });
}

/**
 * Log webhook details
 */
function logWebhook(req, body) {
  console.log('\n🔥 WEBHOOK RECEIVED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('📋 Headers:');
  Object.entries(req.headers).forEach(([key, value]) => {
    if (key.toLowerCase().includes('svix') || key.toLowerCase().includes('clerk')) {
      console.log(`  ${key}: ${value}`);
    }
  });
  
  console.log('\n📦 Body:');
  if (typeof body === 'object') {
    console.log(JSON.stringify(body, null, 2));
  } else {
    console.log(body);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Send JSON response
 */
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Handle requests
 */
async function handleRequest(req, res) {
  const timestamp = new Date().toISOString();
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  console.log(`[${timestamp}] ${method} ${path}`);
  
  try {
    if (method === 'POST' && path === '/test-webhook') {
      const body = await parseBody(req);
      logWebhook(req, body);
      
      sendJSON(res, {
        received: true,
        timestamp: new Date().toISOString(),
        type: body?.type || 'unknown'
      });
      
    } else if (method === 'GET' && path === '/health') {
      sendJSON(res, {
        status: 'healthy',
        service: 'webhook-debug-server',
        timestamp: new Date().toISOString()
      });
      
    } else {
      console.log(`⚠️  Received ${method} request to ${path}`);
      sendJSON(res, {
        error: 'Endpoint not found',
        availableEndpoints: [
          'POST /test-webhook',
          'GET /health'
        ]
      }, 404);
    }
  } catch (error) {
    console.error('❌ Error handling request:', error.message);
    sendJSON(res, {
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
}

const PORT = process.env.WEBHOOK_DEBUG_PORT || 3001;

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log('🔧 Webhook Debug Server Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🎯 Webhook endpoint: http://localhost:${PORT}/test-webhook`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Waiting for webhooks...\n');
});

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down webhook debug server...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
