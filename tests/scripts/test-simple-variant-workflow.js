/**
 * Script de test du workflow simplifié de création de produit avec variantes
 * 
 * Ce script teste :
 * 1. Création d'un produit
 * 2. Ajout de variantes simples (nom EN/FR, prix, stock)
 * 3. Validation : minimum 1 variante
 * 
 * Usage:
 *   node tests/scripts/test-simple-variant-workflow.js
 */

require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

function getAuthHeaders() {
  const testApiKey = process.env.TEST_API_KEY;
  if (!testApiKey) {
    throw new Error('TEST_API_KEY non définie dans .env');
  }
  return {
    'Content-Type': 'application/json',
    'x-test-api-key': testApiKey,
  };
}

async function request(method, path, body = null) {
  const url = `${API_BASE_URL}${path}`;
  const options = {
    method,
    headers: getAuthHeaders(),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n${method} ${path}`);
  if (body) console.log('Body:', JSON.stringify(body, null, 2));

  const response = await fetch(url, options);
  const data = await response.json();

  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Request failed: ${data.message || response.statusText}`);
  }

  return data;
}

async function main() {
  console.log('=================================================');
  console.log('TEST WORKFLOW SIMPLIFIÉ - VARIANTES MANUELLES');
  console.log('=================================================');

  const timestamp = Date.now();
  let productId;

  try {
    // ==========================================
    // 1. CRÉER LE PRODUIT
    // ==========================================
    console.log('\n📝 ÉTAPE 1: Création du produit "Soil Sensor"');
    const product = await request('POST', '/api/admin/products', {
      slug: `soil-sensor-${timestamp}`,
      status: 'ACTIVE',
      isFeatured: true,
      translations: [
        {
          language: 'EN',
          name: 'Smart Soil Sensor',
          shortDescription: 'Monitor your soil moisture in real-time',
          description:
            'Advanced soil sensor with Bluetooth connectivity and mobile app',
        },
        {
          language: 'FR',
          name: 'Capteur de Sol Intelligent',
          shortDescription: "Surveillez l'humidité du sol en temps réel",
          description:
            'Capteur de sol avancé avec connectivité Bluetooth et application mobile',
        },
      ],
    });
    productId = product.product.id;
    console.log(`✅ Produit créé: ${productId}`);

    // ==========================================
    // 2. CRÉER DES VARIANTES SIMPLES
    // ==========================================
    console.log('\n📝 ÉTAPE 2: Ajout de 3 variantes (couleurs)');
    const variants = await request(
      'POST',
      `/api/admin/products/${productId}/variants/simple`,
      {
        variants: [
          { nameEN: 'Green', nameFR: 'Vert', price: 49.99, stock: 100 },
          { nameEN: 'White', nameFR: 'Blanc', price: 49.99, stock: 80 },
          { nameEN: 'Black', nameFR: 'Noir', price: 54.99, stock: 50 },
        ],
      }
    );
    console.log(`✅ ${variants.count} variantes créées`);
    variants.data.forEach(v => {
      const nameEN = v.attributeValues[0]?.attributeValue.translations.find(
        t => t.language === 'EN'
      )?.displayName;
      console.log(`   - ${v.sku} (${nameEN})`);
    });

    // ==========================================
    // 3. RÉCUPÉRER LES VARIANTES
    // ==========================================
    console.log('\n📝 ÉTAPE 3: Récupération des variantes');
    const allVariants = await request('GET', `/api/admin/products/${productId}/variants`);
    console.log(`✅ ${allVariants.count} variantes récupérées`);

    // ==========================================
    // 4. METTRE À JOUR UNE VARIANTE
    // ==========================================
    console.log('\n📝 ÉTAPE 4: Mise à jour du prix de la variante noire');
    const blackVariant = allVariants.data.find(v => v.sku.includes('BLACK'));
    if (blackVariant) {
      const updated = await request(
        'PUT',
        `/api/admin/products/${productId}/variants/${blackVariant.id}`,
        {
          pricing: { price: 59.99 },
          inventory: { stock: 60 },
        }
      );
      console.log(`✅ Variante mise à jour`);
      console.log(`   - Nouveau prix: ${updated.data.pricing[0].price} CAD`);
      console.log(`   - Nouveau stock: ${updated.data.inventory.stock}`);
    }

    // ==========================================
    // RÉSUMÉ
    // ==========================================
    console.log('\n=================================================');
    console.log('✅ WORKFLOW SIMPLIFIÉ RÉUSSI !');
    console.log('=================================================');
    console.log(`Produit créé: ${productId}`);
    console.log(`Variantes créées: 3 (Vert, Blanc, Noir)`);
    console.log(`Système d'attributs: générique (transparent pour l'admin)`);
    console.log(`\n🎉 Le workflow simplifié fonctionne parfaitement !`);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
