/**
 * Script de validation des fonctionnalités clés
 * Teste tous les endpoints critiques avant le développement du dashboard
 */

const TestClient = require('../utils/test-client');
const { PrismaClient } = require('../../src/generated/prisma');

const client = new TestClient();
const prisma = new PrismaClient();

async function validateFeatures() {
  console.log('🎯 Validation des fonctionnalités E-commerce Starter v2\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Health Check
  try {
    console.log('1️⃣  Test Health Check');
    const health = await client.get('/api/internal/health');
    if (health.success && health.data.data.status === 'healthy') {
      console.log('   ✅ API opérationnelle\n');
      passedTests++;
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    console.log('   ❌ Health check échoué:', error.message, '\n');
    failedTests++;
  }

  // Test 2: Database Connection
  try {
    console.log('2️⃣  Test connexion Database');
    const userCount = await prisma.user.count();
    console.log(`   ✅ Database connectée (${userCount} utilisateurs)\n`);
    passedTests++;
  } catch (error) {
    console.log('   ❌ Database non accessible:', error.message, '\n');
    failedTests++;
  }

  // Test 3: GET Products (Public)
  try {
    console.log('3️⃣  Test GET /api/products (Public)');
    const products = await client.get('/api/products?limit=5');
    if (products.success) {
      console.log(
        `   ✅ ${products.data.data.length} produits récupérés\n`
      );
      passedTests++;
    } else {
      throw new Error('Failed to fetch products');
    }
  } catch (error) {
    console.log('   ❌ GET products échoué:', error.message, '\n');
    failedTests++;
  }

  // Test 4: POST Product (Admin required - devrait échouer sans auth)
  try {
    console.log('4️⃣  Test POST /api/products (Protection Admin)');
    const createProduct = await client.post('/api/products', {
      slug: `test-${Date.now()}`,
      status: 'DRAFT',
      translations: [{ language: 'FR', name: 'Test Product' }],
    });

    if (createProduct.status === 401 || createProduct.status === 403) {
      console.log('   ✅ Protection admin active (401/403 attendu)\n');
      passedTests++;
    } else if (createProduct.success) {
      console.log(
        '   ⚠️  Produit créé sans auth (WARNING: protection manquante)\n'
      );
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Test protection échoué:', error.message, '\n');
    failedTests++;
  }

  // Test 5: User Role Management (DB)
  try {
    console.log('5️⃣  Test gestion des rôles utilisateurs');
    const clientUser = await prisma.user.findFirst({
      where: { role: 'CLIENT' },
    });

    if (clientUser) {
      const promoted = await prisma.user.update({
        where: { id: clientUser.id },
        data: { role: 'ADMIN' },
      });

      const demoted = await prisma.user.update({
        where: { id: clientUser.id },
        data: { role: 'CLIENT' },
      });

      if (promoted.role === 'ADMIN' && demoted.role === 'CLIENT') {
        console.log('   ✅ Toggle rôle CLIENT ↔ ADMIN fonctionnel\n');
        passedTests++;
      } else {
        throw new Error('Role toggle failed');
      }
    } else {
      console.log('   ⚠️  Aucun utilisateur CLIENT pour tester\n');
      passedTests++;
    }
  } catch (error) {
    console.log('   ❌ Test rôles échoué:', error.message, '\n');
    failedTests++;
  }

  // Test 6: Cart Operations (Anonymous)
  try {
    console.log('6️⃣  Test opérations panier (anonyme)');

    const variant = await prisma.productVariant.findFirst({
      include: { inventory: true },
    });

    if (!variant) {
      console.log('   ⚠️  Aucune variante produit pour tester le panier\n');
      passedTests++;
    } else {
      const anonymousId = `test-${Date.now()}`;

      // Add to cart
      const addResult = await client.post('/api/cart/items', {
        anonymousId,
        variantId: variant.id,
        quantity: 1,
      });

      if (addResult.success && addResult.data.cart.items.length > 0) {
        const itemId = addResult.data.cart.items[0].id;

        // Remove from cart
        const removeResult = await client.delete(`/api/cart/items/${itemId}`);

        if (removeResult.success) {
          console.log('   ✅ Ajout/Suppression panier fonctionnels\n');
          passedTests++;
        } else {
          throw new Error('Cart remove failed');
        }
      } else {
        throw new Error('Cart add failed');
      }
    }
  } catch (error) {
    console.log('   ❌ Test panier échoué:', error.message, '\n');
    failedTests++;
  }

  // Test 7: Cart Stock Validation
  try {
    console.log('7️⃣  Test validation stock panier');

    const variant = await prisma.productVariant.findFirst({
      where: {
        inventory: {
          trackInventory: true,
          stock: { gt: 0 },
        },
      },
      include: { inventory: true },
    });

    if (!variant || !variant.inventory) {
      console.log('   ⚠️  Aucune variante avec stock pour tester\n');
      passedTests++;
    } else {
      const anonymousId = `test-stock-${Date.now()}`;
      const excessiveQuantity = variant.inventory.stock + 1000;

      const addResult = await client.post('/api/cart/items', {
        anonymousId,
        variantId: variant.id,
        quantity: excessiveQuantity,
      });

      if (
        !addResult.success &&
        (addResult.error?.message?.includes('stock') ||
          addResult.status === 400)
      ) {
        console.log('   ✅ Validation stock active\n');
        passedTests++;
      } else {
        console.log('   ⚠️  Validation stock manquante\n');
        failedTests++;
      }
    }
  } catch (error) {
    console.log('   ❌ Test validation stock échoué:', error.message, '\n');
    failedTests++;
  }

  // Test 8: Webhook Endpoint
  try {
    console.log('8️⃣  Test endpoint webhook Clerk');
    const webhookResponse = await client.post('/api/webhooks/clerk', {
      type: 'user.created',
      data: { id: 'test' }
    });

    // Devrait échouer (signature invalide) mais l'endpoint doit exister
    if (webhookResponse.status === 400 || webhookResponse.status === 401) {
      console.log('   ✅ Endpoint webhook disponible (signature requise)\n');
      passedTests++;
    } else {
      throw new Error('Unexpected webhook response');
    }
  } catch (error) {
    console.log('   ❌ Test webhook échoué:', error.message, '\n');
    failedTests++;
  }

  // Résumé
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 RÉSULTATS\n');
  console.log(`   ✅ Tests réussis: ${passedTests}`);
  console.log(`   ❌ Tests échoués: ${failedTests}`);
  console.log(`   📈 Taux de réussite: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%\n`);

  if (failedTests === 0) {
    console.log('🎉 Toutes les fonctionnalités sont opérationnelles !');
    console.log('✨ Vous pouvez procéder au développement du dashboard admin.\n');
  } else {
    console.log(
      '⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.\n'
    );
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  validateFeatures().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  });
}

module.exports = { validateFeatures };
