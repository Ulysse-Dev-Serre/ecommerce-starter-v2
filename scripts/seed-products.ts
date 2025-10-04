import { faker } from '@faker-js/faker';

import {
  PrismaClient,
  ProductStatus,
  Language,
  MediaType,
} from '../src/generated/prisma';

const prisma = new PrismaClient();

const PRODUCT_TEMPLATES = [
  {
    slug: 'samsung-galaxy-s24',
    categorySlug: 'smartphones',
    isFeatured: true,
    translations: {
      fr: {
        name: 'Samsung Galaxy S24',
        description:
          'Le flagship Samsung avec écran AMOLED 6.2" et processeur Snapdragon 8 Gen 3.',
        shortDescription: 'Smartphone Samsung premium',
      },
      en: {
        name: 'Samsung Galaxy S24',
        description:
          'Samsung flagship with 6.2" AMOLED display and Snapdragon 8 Gen 3 processor.',
        shortDescription: 'Premium Samsung smartphone',
      },
    },
    variants: [
      {
        sku: 'SGS24-128-BLACK',
        attributes: [
          { key: 'color', value: 'black' },
          { key: 'storage', value: '128gb' },
        ],
        price: 1099.99,
        stock: 40,
      },
      {
        sku: 'SGS24-256-BLACK',
        attributes: [
          { key: 'color', value: 'black' },
          { key: 'storage', value: '256gb' },
        ],
        price: 1299.99,
        stock: 30,
      },
    ],
  },
  {
    slug: 'macbook-pro-14-m3',
    categorySlug: 'laptops',
    isFeatured: true,
    translations: {
      fr: {
        name: 'MacBook Pro 14" M3',
        description:
          'MacBook Pro avec écran Liquid Retina XDR et puce M3 Pro pour les professionnels.',
        shortDescription: 'Ordinateur portable professionnel Apple',
      },
      en: {
        name: 'MacBook Pro 14" M3',
        description:
          'MacBook Pro with Liquid Retina XDR display and M3 Pro chip for professionals.',
        shortDescription: 'Professional Apple laptop',
      },
    },
    variants: [
      {
        sku: 'MBP14-M3-512-GRAY',
        attributes: [
          { key: 'color', value: 'black' },
          { key: 'storage', value: '512gb' },
        ],
        price: 2499.99,
        stock: 10,
      },
    ],
  },
  {
    slug: 'dell-xps-15',
    categorySlug: 'laptops',
    isFeatured: false,
    translations: {
      fr: {
        name: 'Dell XPS 15',
        description:
          "Laptop Dell performant avec écran 15.6\" 4K et processeur Intel Core i7.",
        shortDescription: 'Ordinateur portable Dell haute performance',
      },
      en: {
        name: 'Dell XPS 15',
        description:
          'Powerful Dell laptop with 15.6" 4K display and Intel Core i7 processor.',
        shortDescription: 'High-performance Dell laptop',
      },
    },
    variants: [
      {
        sku: 'DXPS15-512-SILVER',
        attributes: [
          { key: 'color', value: 'white' },
          { key: 'storage', value: '512gb' },
        ],
        price: 1799.99,
        stock: 8,
      },
    ],
  },
  {
    slug: 'hoodie-premium',
    categorySlug: 'mens-clothing',
    isFeatured: true,
    translations: {
      fr: {
        name: 'Hoodie Premium',
        description:
          'Sweat à capuche en coton bio épais, parfait pour toute saison.',
        shortDescription: 'Hoodie coton bio premium',
      },
      en: {
        name: 'Premium Hoodie',
        description:
          'Thick organic cotton hoodie, perfect for any season.',
        shortDescription: 'Premium organic cotton hoodie',
      },
    },
    variants: [
      {
        sku: 'HOODIE-PREM-M-BLACK',
        attributes: [
          { key: 'color', value: 'black' },
          { key: 'size', value: 'm' },
        ],
        price: 79.99,
        stock: 50,
      },
      {
        sku: 'HOODIE-PREM-L-BLACK',
        attributes: [
          { key: 'color', value: 'black' },
          { key: 'size', value: 'l' },
        ],
        price: 79.99,
        stock: 45,
      },
      {
        sku: 'HOODIE-PREM-M-BLUE',
        attributes: [
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'm' },
        ],
        price: 79.99,
        stock: 30,
      },
    ],
  },
  {
    slug: 'jeans-slim-fit',
    categorySlug: 'mens-clothing',
    isFeatured: false,
    translations: {
      fr: {
        name: 'Jeans Slim Fit',
        description: 'Jeans coupe ajustée en denim stretch pour un confort optimal.',
        shortDescription: 'Jeans slim confortable',
      },
      en: {
        name: 'Slim Fit Jeans',
        description: 'Slim-fit jeans in stretch denim for optimal comfort.',
        shortDescription: 'Comfortable slim jeans',
      },
    },
    variants: [
      {
        sku: 'JEANS-SLIM-32-BLUE',
        attributes: [
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'm' },
        ],
        price: 89.99,
        stock: 35,
      },
      {
        sku: 'JEANS-SLIM-34-BLUE',
        attributes: [
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'l' },
        ],
        price: 89.99,
        stock: 40,
      },
      {
        sku: 'JEANS-SLIM-32-BLACK',
        attributes: [
          { key: 'color', value: 'black' },
          { key: 'size', value: 'm' },
        ],
        price: 89.99,
        stock: 28,
      },
    ],
  },
  {
    slug: 'google-pixel-8-pro',
    categorySlug: 'smartphones',
    isFeatured: false,
    translations: {
      fr: {
        name: 'Google Pixel 8 Pro',
        description:
          'Smartphone Google avec intelligence artificielle avancée et appareil photo exceptionnel.',
        shortDescription: 'Smartphone Google IA avancée',
      },
      en: {
        name: 'Google Pixel 8 Pro',
        description:
          'Google smartphone with advanced AI and exceptional camera.',
        shortDescription: 'Google AI-powered smartphone',
      },
    },
    variants: [
      {
        sku: 'GP8PRO-128-BLACK',
        attributes: [
          { key: 'color', value: 'black' },
          { key: 'storage', value: '128gb' },
        ],
        price: 999.99,
        stock: 20,
      },
      {
        sku: 'GP8PRO-256-WHITE',
        attributes: [
          { key: 'color', value: 'white' },
          { key: 'storage', value: '256gb' },
        ],
        price: 1199.99,
        stock: 15,
      },
    ],
  },
];

async function seedProducts() {
  console.log('📦 Ajout de nouveaux produits...\n');

  try {
    for (const productData of PRODUCT_TEMPLATES) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug: productData.slug },
      });

      if (existingProduct) {
        console.log(`⚠️  Produit existe déjà: ${productData.slug}`);
        continue;
      }

      const category = await prisma.category.findUnique({
        where: { slug: productData.categorySlug },
      });

      if (!category) {
        console.log(
          `⚠️  Catégorie introuvable: ${productData.categorySlug} (ignoré: ${productData.slug})`
        );
        continue;
      }

      const product = await prisma.product.create({
        data: {
          slug: productData.slug,
          status: ProductStatus.ACTIVE,
          isFeatured: productData.isFeatured,
        },
      });

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

      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: category.id,
        },
      });

      for (const variantData of productData.variants) {
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: variantData.sku,
            weight: faker.number.float({
              min: 0.2,
              max: 2.5,
              fractionDigits: 2,
            }),
          },
        });

        await prisma.productVariantPricing.create({
          data: {
            variantId: variant.id,
            priceType: 'base',
            price: variantData.price,
            currency: 'CAD',
          },
        });

        await prisma.productVariantInventory.create({
          data: {
            variantId: variant.id,
            stock: variantData.stock,
            lowStockThreshold: 10,
          },
        });

        for (const attrData of variantData.attributes) {
          const attribute = await prisma.productAttribute.findUnique({
            where: { key: attrData.key },
          });

          if (attribute) {
            const attributeValue = await prisma.productAttributeValue.findFirst(
              {
                where: {
                  attributeId: attribute.id,
                  value: attrData.value,
                },
              }
            );

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

        const imageId = faker.number.int({ min: 100000, max: 999999 });
        await prisma.productMedia.create({
          data: {
            variantId: variant.id,
            url: `https://images.unsplash.com/photo-${imageId}?w=800&h=600&fit=crop`,
            type: MediaType.IMAGE,
            alt: `Image de ${productData.translations.fr.name}`,
            isPrimary: true,
            sortOrder: 0,
          },
        });
      }

      console.log(`✅ Produit créé: ${productData.slug}`);
    }

    const totalProducts = await prisma.product.count();
    console.log(`\n📊 Total de produits dans la base: ${totalProducts}`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des produits:', error);
    throw error;
  }
}

async function main() {
  console.log('🌱 Script de seed des produits\n');

  try {
    await seedProducts();
    console.log('\n✅ Seed des produits terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
