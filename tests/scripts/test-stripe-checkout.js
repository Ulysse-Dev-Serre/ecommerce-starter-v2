/**
 * Script de test pour valider l'intégration Stripe Checkout
 * 
 * Tests:
 * - POST /api/checkout/create-session - Créer une session Stripe
 * - GET /api/checkout/success - Vérifier une session
 * 
 * Usage: node tests/scripts/test-stripe-checkout.js
 */

require('dotenv').config();
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_API_KEY = process.env.TEST_API_KEY;

if (!TEST_API_KEY) {
  console.error('❌ ERROR: TEST_API_KEY not found in .env');
  console.error('   Add TEST_API_KEY to your .env file');
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY not found in .env');
  process.exit(1);
}

/**
 * Helper pour faire des requêtes HTTP
 */
async function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-api-key': TEST_API_KEY,
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Teste la création d'une session Stripe (suppose que le panier a déjà des items)
 */
async function testCreateCheckoutSession() {
  console.log('\n🧪 Test Stripe Checkout');
  console.log('─'.repeat(60));

  try {
    console.log('📋 Prérequis: Panier avec au moins 1 produit');
    console.log('   (Utilisez vos scripts existants pour ajouter un produit au panier)\n');

    // Créer la session checkout
    console.log('💳 Créer la session Stripe Checkout...');
    const response = await request('POST', '/api/checkout/create-session', {
      successUrl: 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3000/cart',
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Session créée avec succès!');
      console.log(`   Session ID: ${response.data.sessionId}`);
      console.log(`   URL Stripe: ${response.data.url}`);
      console.log('\n📋 Prochaines étapes:');
      console.log(`   1. Ouvrir: ${response.data.url}`);
      console.log('   2. Payer avec: 4242 4242 4242 4242');
      console.log('   3. Vérifier la redirection vers /checkout/success');
      
      return response.data.sessionId;
    } else {
      console.error('❌ Échec de création de session');
      console.error(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

/**
 * Teste la vérification d'une session
 */
async function testCheckoutSuccess(sessionId) {
  if (!sessionId) {
    console.log('\n⚠️  Aucun sessionId fourni, skip test de vérification');
    return;
  }

  console.log('\n🧪 Test 2: Vérifier la session après paiement');
  console.log('─'.repeat(60));

  try {
    const response = await request('GET', `/api/checkout/success?session_id=${sessionId}`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Session récupérée avec succès!');
      console.log(`   Payment Status: ${response.data.session.paymentStatus}`);
      console.log(`   Amount: ${response.data.session.amountTotal} ${response.data.session.currency.toUpperCase()}`);
      console.log(`   Customer Email: ${response.data.session.customerEmail || 'N/A'}`);
    } else {
      console.error('❌ Échec de récupération de session');
      console.error(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

/**
 * Test de santé du serveur
 */
async function checkServerHealth() {
  console.log('🏥 Vérification de l\'état du serveur...');
  try {
    const response = await request('GET', '/api/internal/health');
    if (response.status === 200) {
      console.log('✅ Serveur OK\n');
      return true;
    }
  } catch (error) {
    console.error('❌ Serveur non accessible. Assurez-vous que `npm run dev` est lancé.');
    return false;
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Test Stripe Checkout Integration');
  console.log('═'.repeat(60));

  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    process.exit(1);
  }

  const sessionId = await testCreateCheckoutSession();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📝 Instructions:');
  console.log('   1. Ouvrir l\'URL Stripe affichée ci-dessus');
  console.log('   2. Payer avec la carte test: 4242 4242 4242 4242');
  console.log('   3. Après paiement, exécuter:');
  console.log(`      node tests/scripts/test-stripe-checkout.js verify ${sessionId || 'SESSION_ID'}`);
  console.log('═'.repeat(60));
}

// Permet de vérifier une session existante
const args = process.argv.slice(2);
if (args[0] === 'verify' && args[1]) {
  checkServerHealth().then((healthy) => {
    if (healthy) {
      testCheckoutSuccess(args[1]);
    }
  });
} else {
  main();
}
