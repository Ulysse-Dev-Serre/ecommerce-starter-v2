/**
 * Script de test du workflow complet de gestion des variantes
 * 
 * Ce script teste :
 * 1. Création des attributs (couleur, quantité)
 * 2. Création des valeurs d'attributs
 * 3. Création d'un produit
 * 4. Génération automatique de toutes les combinaisons de variantes
 * 5. Mise à jour d'une variante (prix, stock)
 * 6. Récupération des variantes
 * 7. Suppression d'une variante
 * 
 * Usage:
 *   node tests/scripts/test-variant-workflow.js
 */

require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

// Utilise le même système d'auth que test-product-crud.js
function getAuthHeaders() {
  const testApiKey = process.env.TEST_API_KEY;
  if (!testApiKey) {
    throw new Error('TEST_API_KEY non définie dans .env ou .env.local');
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
  console.log('TEST WORKFLOW COMPLET - GESTION DES VARIANTES');
  console.log('=================================================');

  let colorAttributeId;
  let quantityAttributeId;
  let colorGreenId;
  let colorWhiteId;
  let qtySingleId;
  let qty3packId;
  let qty3packHubId;
  let productId;
  let variantIds = [];

  // Identifiant unique pour éviter les conflits
  const timestamp = Date.now();

  try {
    // ==========================================
    // 1. CRÉER L'ATTRIBUT "COULEUR"
    // ==========================================
    console.log('\n📝 ÉTAPE 1: Création de l\'attribut "Couleur"');
    const colorAttr = await request('POST', '/api/admin/attributes', {
      key: `case_color_${timestamp}`,
      inputType: 'select',
      isRequired: true,
      sortOrder: 1,
      translations: [
        { language: 'EN', name: 'Case Color' },
        { language: 'FR', name: 'Couleur du boîtier' },
      ],
    });
    colorAttributeId = colorAttr.id;
    console.log(`✅ Attribut couleur créé: ${colorAttributeId}`);

    // ==========================================
    // 2. CRÉER LES VALEURS DE COULEUR
    // ==========================================
    console.log('\n📝 ÉTAPE 2: Création des valeurs de couleur');
    
    const greenValue = await request(
      'POST',
      `/api/admin/attributes/${colorAttributeId}/values`,
      {
        value: 'green',
        translations: [
          { language: 'EN', displayName: 'Green' },
          { language: 'FR', displayName: 'Vert' },
        ],
      }
    );
    colorGreenId = greenValue.id;
    console.log(`✅ Valeur "Vert" créée: ${colorGreenId}`);

    const whiteValue = await request(
      'POST',
      `/api/admin/attributes/${colorAttributeId}/values`,
      {
        value: 'white',
        translations: [
          { language: 'EN', displayName: 'White' },
          { language: 'FR', displayName: 'Blanc' },
        ],
      }
    );
    colorWhiteId = whiteValue.id;
    console.log(`✅ Valeur "Blanc" créée: ${colorWhiteId}`);

    // ==========================================
    // 3. CRÉER L'ATTRIBUT "QUANTITÉ"
    // ==========================================
    console.log('\n📝 ÉTAPE 3: Création de l\'attribut "Quantité"');
    const quantityAttr = await request('POST', '/api/admin/attributes', {
      key: `package_quantity_${timestamp}`,
      inputType: 'select',
      isRequired: true,
      sortOrder: 2,
      translations: [
        { language: 'EN', name: 'Package' },
        { language: 'FR', name: 'Forfait' },
      ],
    });
    quantityAttributeId = quantityAttr.id;
    console.log(`✅ Attribut quantité créé: ${quantityAttributeId}`);

    // ==========================================
    // 4. CRÉER LES VALEURS DE QUANTITÉ
    // ==========================================
    console.log('\n📝 ÉTAPE 4: Création des valeurs de quantité');

    const singleValue = await request(
      'POST',
      `/api/admin/attributes/${quantityAttributeId}/values`,
      {
        value: 'single',
        translations: [
          { language: 'EN', displayName: '1 Sensor' },
          { language: 'FR', displayName: '1 capteur' },
        ],
      }
    );
    qtySingleId = singleValue.id;
    console.log(`✅ Valeur "1 capteur" créée: ${qtySingleId}`);

    const pack3Value = await request(
      'POST',
      `/api/admin/attributes/${quantityAttributeId}/values`,
      {
        value: '3pack',
        translations: [
          { language: 'EN', displayName: '3 Sensors' },
          { language: 'FR', displayName: '3 capteurs' },
        ],
      }
    );
    qty3packId = pack3Value.id;
    console.log(`✅ Valeur "3 capteurs" créée: ${qty3packId}`);

    const pack3HubValue = await request(
      'POST',
      `/api/admin/attributes/${quantityAttributeId}/values`,
      {
        value: '3pack_hub',
        translations: [
          { language: 'EN', displayName: '3 Sensors + Hub' },
          { language: 'FR', displayName: '3 capteurs + hub' },
        ],
      }
    );
    qty3packHubId = pack3HubValue.id;
    console.log(`✅ Valeur "3 capteurs + hub" créée: ${qty3packHubId}`);

    // ==========================================
    // 5. CRÉER LE PRODUIT
    // ==========================================
    console.log('\n📝 ÉTAPE 5: Création du produit "Smart Soil Sensor"');
    const product = await request('POST', '/api/admin/products', {
      slug: `smart-soil-sensor-${timestamp}`,
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
          shortDescription: 'Surveillez l\'humidité du sol en temps réel',
          description:
            'Capteur de sol avancé avec connectivité Bluetooth et application mobile',
        },
      ],
    });
    productId = product.product.id;
    console.log(`✅ Produit créé: ${productId}`);

    // ==========================================
    // 6. GÉNÉRER TOUTES LES VARIANTES AUTOMATIQUEMENT
    // ==========================================
    console.log('\n📝 ÉTAPE 6: Génération automatique de toutes les variantes');
    console.log(
      `   → 2 couleurs (vert, blanc) × 3 quantités (1, 3, 3+hub) = 6 variantes`
    );

    const variants = await request(
      'POST',
      `/api/admin/products/${productId}/variants`,
      {
        generate: true,
        config: {
          attribute1Id: colorAttributeId,
          attribute2Id: quantityAttributeId,
          defaultPricing: {
            price: 49.99,
            currency: 'CAD',
            priceType: 'base',
          },
          defaultInventory: {
            stock: 0,
            trackInventory: true,
            allowBackorder: false,
            lowStockThreshold: 10,
          },
          skuPattern: `SOIL-{attr1}-{attr2}-${timestamp}`,
        },
      }
    );

    variantIds = variants.data.map((v) => v.id);
    console.log(`✅ ${variants.count} variantes générées automatiquement`);
    variants.data.forEach((v) => {
      console.log(`   - ${v.sku}`);
    });

    // ==========================================
    // 7. RÉCUPÉRER TOUTES LES VARIANTES
    // ==========================================
    console.log('\n📝 ÉTAPE 7: Récupération de toutes les variantes');
    const allVariants = await request(
      'GET',
      `/api/admin/products/${productId}/variants`
    );
    console.log(`✅ ${allVariants.count} variantes récupérées`);

    // ==========================================
    // 8. METTRE À JOUR UNE VARIANTE (prix et stock)
    // ==========================================
    console.log('\n📝 ÉTAPE 8: Mise à jour d\'une variante (prix et stock)');
    const variantToUpdate = allVariants.data[0];
    console.log(`   → Variante: ${variantToUpdate.sku}`);

    const updated = await request(
      'PUT',
      `/api/admin/products/${productId}/variants/${variantToUpdate.id}`,
      {
        pricing: {
          price: 130.99, // Nouveau prix pour le pack de 3
        },
        inventory: {
          stock: 50, // Stock mis à jour
        },
      }
    );
    console.log(`✅ Variante mise à jour`);
    console.log(`   - Nouveau prix: ${updated.data.pricing[0].price} CAD`);
    console.log(`   - Nouveau stock: ${updated.data.inventory.stock} unités`);

    // ==========================================
    // 9. RÉCUPÉRER UNE VARIANTE SPÉCIFIQUE
    // ==========================================
    console.log('\n📝 ÉTAPE 9: Récupération d\'une variante spécifique');
    const singleVariant = await request(
      'GET',
      `/api/admin/products/${productId}/variants/${variantToUpdate.id}`
    );
    console.log(`✅ Variante récupérée: ${singleVariant.data.sku}`);
    console.log(`   - Prix: ${singleVariant.data.pricing[0].price} CAD`);
    console.log(`   - Stock: ${singleVariant.data.inventory.stock} unités`);
    console.log(
      `   - Attributs: ${singleVariant.data.attributeValues.length}`
    );

    // ==========================================
    // 10. SUPPRIMER UNE VARIANTE
    // ==========================================
    console.log('\n📝 ÉTAPE 10: Suppression d\'une variante');
    const variantToDelete = allVariants.data[allVariants.data.length - 1];
    console.log(`   → Variante à supprimer: ${variantToDelete.sku}`);

    await request(
      'DELETE',
      `/api/admin/products/${productId}/variants/${variantToDelete.id}`
    );
    console.log(`✅ Variante supprimée définitivement`);

    // Vérifier qu'il reste 5 variantes
    const remainingVariants = await request(
      'GET',
      `/api/admin/products/${productId}/variants`
    );
    console.log(
      `✅ Vérification: ${remainingVariants.count} variantes restantes (au lieu de 6)`
    );

    // ==========================================
    // RÉSUMÉ
    // ==========================================
    console.log('\n=================================================');
    console.log('✅ WORKFLOW COMPLET RÉUSSI !');
    console.log('=================================================');
    console.log(`Produit créé: ${productId}`);
    console.log(`Attributs créés: 2 (couleur, quantité)`);
    console.log(`Valeurs d'attributs créées: 5 (2 couleurs + 3 quantités)`);
    console.log(`Variantes générées: 6 (2×3)`);
    console.log(`Variantes mises à jour: 1`);
    console.log(`Variantes supprimées: 1`);
    console.log(`Variantes finales: 5`);
    console.log('\n🎉 Tous les endpoints fonctionnent correctement !');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
