// prisma/seed.ts
import { faker } from '@faker-js/faker';

import {
  PrismaClient,
  UserRole,
  ProductStatus,
  Language,
  MediaType,
  Category,
  ProductAttribute,
} from '../src/generated/prisma';

const prisma = new PrismaClient();

// Configuration pour les utilisateurs de test
const TEST_USERS = [
  {
    // Utilisateur admin de test - vous devrez créer cet utilisateur dans Clerk avec cet email
    clerkId: 'user_test_admin_123', // Remplacez par un vrai clerkId après création
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'Hydro',
    role: UserRole.ADMIN,
    imageUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  },
  {
    // Client test - vous devrez créer cet utilisateur dans Clerk
    clerkId: 'user_test_client_456', // Remplacez par un vrai clerkId après création
    email: 'client@test.com',
    firstName: 'Client',
    lastName: 'Jardinier',
    role: UserRole.CLIENT,
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  },
];

// Catégories de base
const CATEGORIES = [
  {
    slug: 'hydroponic-systems',
    translations: {
      fr: {
        name: 'Systèmes Hydroponiques',
        description: 'Systèmes de culture hydroponique pour plantes',
      },
      en: {
        name: 'Hydroponic Systems',
        description: 'Hydroponic growing systems for plants',
      },
    },
  },
  {
    slug: 'sensors-monitoring',
    translations: {
      fr: {
        name: 'Capteurs et Monitoring',
        description: 'Capteurs pour surveillance des plantes',
      },
      en: {
        name: 'Sensors & Monitoring',
        description: 'Sensors for plant monitoring',
      },
    },
  },
];

// Attributs produits
const PRODUCT_ATTRIBUTES = [
  {
    key: 'color',
    translations: {
      fr: { name: 'Couleur' },
      en: { name: 'Color' },
    },
    values: [
      {
        value: 'green',
        translations: {
          fr: { displayName: 'Vert' },
          en: { displayName: 'Green' },
        },
      },
      {
        value: 'white',
        translations: {
          fr: { displayName: 'Blanc' },
          en: { displayName: 'White' },
        },
      },
    ],
  },
];

async function clearDatabase(): Promise<void> {
  console.info('🗑️  Nettoyage de la base de données...');

  // L'ordre est important à cause des contraintes de clés étrangères
  await prisma.auditLog.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.shipmentItem.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.productVariantAttributeValue.deleteMany({});
  await prisma.productVariantInventory.deleteMany({});
  await prisma.productVariantPricing.deleteMany({});
  await prisma.productMedia.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.productTranslation.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productAttributeValueTranslation.deleteMany({});
  await prisma.productAttributeValue.deleteMany({});
  await prisma.productAttributeTranslation.deleteMany({});
  await prisma.productAttribute.deleteMany({});
  await prisma.categoryTranslation.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
}

async function seedUsers(): Promise<void> {
  console.info('👥 Création des utilisateurs de test...');

  for (const userData of TEST_USERS) {
    const user = await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: userData,
      create: userData,
    });
    console.info(`   ✅ Utilisateur créé: ${user.email} (${user.role})`);

    // Créer une adresse par défaut pour chaque utilisateur
    await prisma.address.create({
      data: {
        userId: user.id,
        type: 'BOTH',
        isDefault: true,
        firstName: user.firstName ?? 'Test',
        lastName: user.lastName ?? 'User',
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: 'QC',
        zipCode: faker.location.zipCode(),
        country: 'CA',
        phone: faker.phone.number(),
      },
    });
  }
}

async function seedCategories(): Promise<Map<string, Category>> {
  console.info('📁 Création des catégories...');

  const categoryMap = new Map<string, Category>();

  // Créer d'abord les catégories parentes
  for (const categoryData of CATEGORIES.filter(c => !c.parentSlug)) {
    const category = await prisma.category.create({
      data: {
        slug: categoryData.slug,
        sortOrder: 0,
      },
    });
    categoryMap.set(categoryData.slug, category);

    // Créer les traductions
    for (const [lang, translation] of Object.entries(
      categoryData.translations
    )) {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: category.id,
          language: lang.toUpperCase() as Language,
          name: translation.name,
          description: translation.description,
        },
      });
    }
    console.info(`   ✅ Catégorie créée: ${categoryData.slug}`);
  }

  // Puis les sous-catégories
  for (const categoryData of CATEGORIES.filter(c => c.parentSlug)) {
    const parentCategory = categoryData.parentSlug
      ? categoryMap.get(categoryData.parentSlug)
      : null;
    if (parentCategory) {
      const category = await prisma.category.create({
        data: {
          slug: categoryData.slug,
          parentId: parentCategory.id,
          sortOrder: 0,
        },
      });
      categoryMap.set(categoryData.slug, category);

      // Créer les traductions
      for (const [lang, translation] of Object.entries(
        categoryData.translations
      )) {
        await prisma.categoryTranslation.create({
          data: {
            categoryId: category.id,
            language: lang.toUpperCase() as Language,
            name: translation.name,
            description: translation.description,
          },
        });
      }
      console.info(`   ✅ Sous-catégorie créée: ${categoryData.slug}`);
    }
  }

  return categoryMap;
}

async function seedProductAttributes(): Promise<Map<string, ProductAttribute>> {
  console.info('🏷️  Création des attributs produits...');

  const attributeMap = new Map<string, ProductAttribute>();

  for (const attrData of PRODUCT_ATTRIBUTES) {
    const attribute = await prisma.productAttribute.create({
      data: {
        key: attrData.key,
        inputType: 'select',
      },
    });
    attributeMap.set(attrData.key, attribute);

    // Créer les traductions d'attributs
    for (const [lang, translation] of Object.entries(attrData.translations)) {
      await prisma.productAttributeTranslation.create({
        data: {
          attributeId: attribute.id,
          language: lang.toUpperCase() as Language,
          name: translation.name,
        },
      });
    }

    // Créer les valeurs d'attributs
    for (const valueData of attrData.values) {
      const attributeValue = await prisma.productAttributeValue.create({
        data: {
          attributeId: attribute.id,
          value: valueData.value,
        },
      });

      // Créer les traductions de valeurs
      for (const [lang, translation] of Object.entries(
        valueData.translations
      )) {
        await prisma.productAttributeValueTranslation.create({
          data: {
            attributeValueId: attributeValue.id,
            language: lang.toUpperCase() as Language,
            displayName: translation.displayName,
          },
        });
      }
    }

    console.info(`   ✅ Attribut créé: ${attrData.key}`);
  }

  return attributeMap;
}

async function seedProducts(
  categoryMap: Map<string, Category>,
  attributeMap: Map<string, ProductAttribute>
): Promise<void> {
  console.info('📦 Création des produits...');

  const SAMPLE_PRODUCTS = [
    {
      slug: 'hydroponic-growing-system',
      categorySlug: 'hydroponic-systems',
      isFeatured: true,
      translations: {
        fr: {
          name: 'Système de Culture Hydroponique',
          description:
            'Système hydroponique complet pour cultiver vos plantes sans sol. Idéal pour légumes et herbes aromatiques.',
          shortDescription: 'Système hydroponique tout-en-un',
        },
        en: {
          name: 'Hydroponic Growing System',
          description:
            'Complete hydroponic system to grow your plants without soil. Perfect for vegetables and herbs.',
          shortDescription: 'All-in-one hydroponic system',
        },
      },
      variants: [
        {
          sku: 'HYDRO-SYS-GREEN',
          attributes: [{ key: 'color', value: 'green' }],
          price: 149.99,
          stock: 20,
        },
        {
          sku: 'HYDRO-SYS-WHITE',
          attributes: [{ key: 'color', value: 'white' }],
          price: 149.99,
          stock: 15,
        },
      ],
    },
    {
      slug: 'soil-humidity-sensor',
      categorySlug: 'sensors-monitoring',
      isFeatured: true,
      translations: {
        fr: {
          name: "Capteur d'Humidité du Sol",
          description:
            "Capteur intelligent pour mesurer l'humidité du sol en temps réel. Connecté à une application mobile.",
          shortDescription: "Capteur d'humidité connecté",
        },
        en: {
          name: 'Soil Humidity Sensor',
          description:
            'Smart sensor to measure soil humidity in real-time. Connected to mobile app.',
          shortDescription: 'Connected humidity sensor',
        },
      },
      variants: [
        {
          sku: 'SENSOR-HUM-GREEN',
          attributes: [{ key: 'color', value: 'green' }],
          price: 39.99,
          stock: 50,
        },
        {
          sku: 'SENSOR-HUM-WHITE',
          attributes: [{ key: 'color', value: 'white' }],
          price: 39.99,
          stock: 45,
        },
      ],
    },
  ];

  for (const productData of SAMPLE_PRODUCTS) {
    // Créer le produit
    const product = await prisma.product.create({
      data: {
        slug: productData.slug,
        status: ProductStatus.ACTIVE,
        isFeatured: productData.isFeatured,
      },
    });

    // Créer les traductions
    for (const [lang, translation] of Object.entries(
      productData.translations
    )) {
      await prisma.productTranslation.create({
        data: {
          productId: product.id,
          language: lang.toUpperCase() as Language,
          name: translation.name,
          description: translation.description,
          shortDescription: translation.shortDescription,
        },
      });
    }

    // Associer à la catégorie
    const category = categoryMap.get(productData.categorySlug);
    if (category) {
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: category.id,
        },
      });
    }

    // Créer les variantes
    for (const variantData of productData.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: variantData.sku,
          weight: 0.5,
        },
      });

      // Prix
      await prisma.productVariantPricing.create({
        data: {
          variantId: variant.id,
          priceType: 'base',
          price: variantData.price,
          currency: 'CAD',
        },
      });

      // Inventaire
      await prisma.productVariantInventory.create({
        data: {
          variantId: variant.id,
          stock: variantData.stock,
          lowStockThreshold: 10,
        },
      });

      // Attributs de variante
      for (const attrData of variantData.attributes) {
        const attribute = attributeMap.get(attrData.key);
        if (attribute) {
          const attributeValue = await prisma.productAttributeValue.findFirst({
            where: {
              attributeId: attribute.id,
              value: attrData.value,
            },
          });

          if (attributeValue) {
            await prisma.productVariantAttributeValue.create({
              data: {
                variantId: variant.id,
                attributeValueId: attributeValue.id,
              },
            });
          }
        }
      }

      // Image exemple
      await prisma.productMedia.create({
        data: {
          variantId: variant.id,
          url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000000)}?w=800&h=600&fit=crop`,
          type: MediaType.IMAGE,
          alt: `Image de ${productData.translations.fr.name}`,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    console.info(`   ✅ Produit créé: ${productData.slug}`);
  }
}

async function seedTestData(): Promise<void> {
  console.info('🧪 Création de données de test supplémentaires...');

  // Paramètres système
  await prisma.systemSetting.createMany({
    data: [
      { key: 'site_name', value: 'Mon E-commerce', type: 'string' },
      { key: 'currency_default', value: 'CAD', type: 'string' },
      {
        key: 'tax_rate',
        value: '0.14975',
        type: 'number',
        description: 'Taux de taxe par défaut (QC)',
      },
      { key: 'free_shipping_threshold', value: '75.00', type: 'number' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean' },
    ],
  });

  // Coupon de test
  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 50,
      usageLimit: 100,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    },
  });

  console.info('   ✅ Données de test créées');
}

async function main(): Promise<void> {
  console.info('🌱 Démarrage du seed de développement...');
  console.info('');
  console.info(
    "⚠️  IMPORTANT: Assurez-vous d'avoir créé les utilisateurs suivants dans Clerk:"
  );
  console.info('   - admin@test.com (Admin Hydro)');
  console.info('   - client@test.com (Client Jardinier)');
  console.info(
    '   Et mettez à jour les clerkId dans ce fichier avec les vrais IDs de Clerk.'
  );
  console.info('');

  try {
    await clearDatabase();
    await seedUsers();
    const categoryMap = await seedCategories();
    const attributeMap = await seedProductAttributes();
    await seedProducts(categoryMap, attributeMap);
    await seedTestData();

    console.info('');
    console.info('✅ Seed terminé avec succès!');
    console.info('');
    console.info('📋 Résumé:');
    console.info(`   - ${TEST_USERS.length} utilisateurs`);
    console.info(
      `   - ${CATEGORIES.length} catégories (Hydroponique & Capteurs)`
    );
    console.info(
      `   - ${PRODUCT_ATTRIBUTES.length} attribut produit (couleur)`
    );
    console.info(
      '   - 2 produits hydroponiques avec 2 variantes chacun (4 variantes total)'
    );
    console.info('   - Paramètres système et coupon de test');
    console.info('');
    console.info('🔗 Comptes de test:');
    console.info('   Admin: admin@test.com');
    console.info('   Client: client@test.com');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
