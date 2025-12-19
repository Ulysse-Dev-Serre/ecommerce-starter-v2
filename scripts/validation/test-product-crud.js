/**
 * Script de test pour valider les endpoints admin de gestion des produits
 *
 * Tests:
 * - POST /api/admin/products - Créer un produit
 * - PUT /api/admin/products/[id] - Modifier un produit
 * - DELETE /api/admin/products/[id] - Supprimer un produit
 *
 * Usage: node tests/scripts/test-product-crud.js
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

/**
 * Helper pour faire des requêtes HTTP
 */
async function request(method, path, data = null) {
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
      },
    };

    const req = http.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
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

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test principal
 */
async function runTests() {
  console.log('🧪 Test CRUD des produits admin');
  console.log('================================\n');

  let productId = null;
  const testSlug = `test-product-${Date.now()}`;

  try {
    // ========================================
    // Test 1: POST - Créer un produit
    // ========================================
    console.log('1️⃣  POST /api/admin/products - Créer un produit');

    const createPayload = {
      slug: testSlug,
      status: 'DRAFT',
      isFeatured: false,
      sortOrder: 0,
      translations: [
        {
          language: 'EN',
          name: 'Test Product',
          description: 'This is a test product created by automated script',
          shortDescription: 'Test product',
        },
        {
          language: 'FR',
          name: 'Produit de Test',
          description:
            'Ceci est un produit de test créé par un script automatisé',
          shortDescription: 'Produit test',
        },
      ],
    };

    const createResponse = await request(
      'POST',
      '/api/admin/products',
      createPayload
    );

    if (createResponse.status === 201 && createResponse.data.success) {
      productId = createResponse.data.product.id;
      console.log(`   ✅ Produit créé avec succès`);
      console.log(`   ID: ${productId}`);
      console.log(`   Slug: ${createResponse.data.product.slug}`);
      console.log(`   Status: ${createResponse.data.product.status}\n`);
    } else {
      console.log(`   ❌ Échec de création: ${createResponse.status}`);
      console.log(`   Réponse:`, JSON.stringify(createResponse.data, null, 2));
      throw new Error('Failed to create product');
    }

    // Pause de 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // Test 2: PUT - Modifier le produit
    // ========================================
    console.log('2️⃣  PUT /api/admin/products/[id] - Modifier le produit');

    const updatePayload = {
      status: 'ACTIVE',
      isFeatured: true,
    };

    const updateResponse = await request(
      'PUT',
      `/api/admin/products/${productId}`,
      updatePayload
    );

    if (updateResponse.status === 200 && updateResponse.data.success) {
      console.log(`   ✅ Produit modifié avec succès`);
      console.log(`   Nouveau status: ${updateResponse.data.data.status}`);
      console.log(`   Featured: ${updateResponse.data.data.isFeatured}\n`);
    } else {
      console.log(`   ❌ Échec de modification: ${updateResponse.status}`);
      console.log(`   Réponse:`, JSON.stringify(updateResponse.data, null, 2));
      throw new Error('Failed to update product');
    }

    // Pause de 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // Test 3: GET - Vérifier le produit (admin)
    // ========================================
    console.log('3️⃣  GET /api/admin/products/[id] - Vérifier le produit');

    const getResponse = await request(
      'GET',
      `/api/admin/products/${productId}`
    );

    if (getResponse.status === 200 && getResponse.data.success) {
      console.log(`   ✅ Produit récupéré avec succès`);
      console.log(`   Slug: ${getResponse.data.data.slug}`);
      console.log(`   Status: ${getResponse.data.data.status}`);
      console.log(`   Featured: ${getResponse.data.data.isFeatured}\n`);
    } else {
      console.log(`   ❌ Échec de récupération: ${getResponse.status}`);
      console.log(`   Réponse:`, JSON.stringify(getResponse.data, null, 2));
      throw new Error('Failed to get product');
    }

    // Pause de 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // Test 4: DELETE - Supprimer le produit
    // ========================================
    console.log('4️⃣  DELETE /api/admin/products/[id] - Supprimer le produit');

    const deleteResponse = await request(
      'DELETE',
      `/api/admin/products/${productId}`
    );

    if (deleteResponse.status === 200 && deleteResponse.data.success) {
      console.log(`   ✅ Produit supprimé avec succès (soft delete)`);
      console.log(`   deletedAt: ${deleteResponse.data.product.deletedAt}\n`);
    } else {
      console.log(`   ❌ Échec de suppression: ${deleteResponse.status}`);
      console.log(`   Réponse:`, JSON.stringify(deleteResponse.data, null, 2));
      throw new Error('Failed to delete product');
    }

    // ========================================
    // Résumé
    // ========================================
    console.log('================================');
    console.log('✅ Tous les tests ont réussi!\n');
    console.log('Résumé:');
    console.log('  ✓ POST - Création de produit');
    console.log('  ✓ PUT - Modification de produit');
    console.log('  ✓ GET - Récupération de produit (admin)');
    console.log('  ✓ DELETE - Suppression de produit\n');
  } catch (error) {
    console.error('\n❌ Une erreur est survenue:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  }
}

// Vérifier que le serveur est bien démarré
console.log('🔍 Vérification de la connexion au serveur...');
console.log(`   URL: ${BASE_URL}`);
console.log(`   Auth: x-test-api-key (${TEST_API_KEY.substring(0, 10)}...)\n`);

// Lancer les tests
runTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
