// prisma/seed.ts
import { PrismaClient, UserRole, ProductStatus, Language, MediaType } from '../src/generated/prisma'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Configuration pour les utilisateurs de test
const TEST_USERS = [
  {
    // Utilisateur admin de test - vous devrez créer cet utilisateur dans Clerk avec cet email
    clerkId: 'user_test_admin_123', // Remplacez par un vrai clerkId après création
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'Test',
    role: UserRole.ADMIN,
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
  },
  {
    // Client test - vous devrez créer cet utilisateur dans Clerk
    clerkId: 'user_test_client_456', // Remplacez par un vrai clerkId après création
    email: 'client@test.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: UserRole.CLIENT,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
  },
  {
    // Client test 2
    clerkId: 'user_test_client2_789',
    email: 'marie@test.com',
    firstName: 'Marie',
    lastName: 'Martin',
    role: UserRole.CLIENT,
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b332c5b1?w=400&h=400&fit=crop&crop=face'
  }
]

// Catégories de base
const CATEGORIES = [
  {
    slug: 'electronics',
    translations: {
      fr: { name: 'Électronique', description: 'Tous nos appareils électroniques' },
      en: { name: 'Electronics', description: 'All our electronic devices' }
    }
  },
  {
    slug: 'smartphones',
    parentSlug: 'electronics',
    translations: {
      fr: { name: 'Smartphones', description: 'Téléphones intelligents' },
      en: { name: 'Smartphones', description: 'Smart phones' }
    }
  },
  {
    slug: 'laptops',
    parentSlug: 'electronics',
    translations: {
      fr: { name: 'Ordinateurs portables', description: 'Laptops et ultrabooks' },
      en: { name: 'Laptops', description: 'Laptops and ultrabooks' }
    }
  },
  {
    slug: 'clothing',
    translations: {
      fr: { name: 'Vêtements', description: 'Mode et vêtements' },
      en: { name: 'Clothing', description: 'Fashion and clothing' }
    }
  },
  {
    slug: 'mens-clothing',
    parentSlug: 'clothing',
    translations: {
      fr: { name: 'Vêtements homme', description: 'Mode masculine' },
      en: { name: 'Men\'s Clothing', description: 'Men\'s fashion' }
    }
  }
]

// Attributs produits
const PRODUCT_ATTRIBUTES = [
  {
    key: 'color',
    translations: {
      fr: { name: 'Couleur' },
      en: { name: 'Color' }
    },
    values: [
      { value: 'red', translations: { fr: { displayName: 'Rouge' }, en: { displayName: 'Red' } } },
      { value: 'blue', translations: { fr: { displayName: 'Bleu' }, en: { displayName: 'Blue' } } },
      { value: 'black', translations: { fr: { displayName: 'Noir' }, en: { displayName: 'Black' } } },
      { value: 'white', translations: { fr: { displayName: 'Blanc' }, en: { displayName: 'White' } } }
    ]
  },
  {
    key: 'size',
    translations: {
      fr: { name: 'Taille' },
      en: { name: 'Size' }
    },
    values: [
      { value: 'xs', translations: { fr: { displayName: 'XS' }, en: { displayName: 'XS' } } },
      { value: 's', translations: { fr: { displayName: 'S' }, en: { displayName: 'S' } } },
      { value: 'm', translations: { fr: { displayName: 'M' }, en: { displayName: 'M' } } },
      { value: 'l', translations: { fr: { displayName: 'L' }, en: { displayName: 'L' } } },
      { value: 'xl', translations: { fr: { displayName: 'XL' }, en: { displayName: 'XL' } } }
    ]
  },
  {
    key: 'storage',
    translations: {
      fr: { name: 'Stockage' },
      en: { name: 'Storage' }
    },
    values: [
      { value: '64gb', translations: { fr: { displayName: '64 Go' }, en: { displayName: '64GB' } } },
      { value: '128gb', translations: { fr: { displayName: '128 Go' }, en: { displayName: '128GB' } } },
      { value: '256gb', translations: { fr: { displayName: '256 Go' }, en: { displayName: '256GB' } } },
      { value: '512gb', translations: { fr: { displayName: '512 Go' }, en: { displayName: '512GB' } } }
    ]
  }
]

async function clearDatabase() {
  console.log('🗑️  Nettoyage de la base de données...')
  
  // L'ordre est important à cause des contraintes de clés étrangères
  await prisma.auditLog.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.shipmentItem.deleteMany({})
  await prisma.shipment.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.orderStatusHistory.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.cart.deleteMany({})
  await prisma.productVariantAttributeValue.deleteMany({})
  await prisma.productVariantInventory.deleteMany({})
  await prisma.productVariantPricing.deleteMany({})
  await prisma.productMedia.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.productCategory.deleteMany({})
  await prisma.productTranslation.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.productAttributeValueTranslation.deleteMany({})
  await prisma.productAttributeValue.deleteMany({})
  await prisma.productAttributeTranslation.deleteMany({})
  await prisma.productAttribute.deleteMany({})
  await prisma.categoryTranslation.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.address.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.systemSetting.deleteMany({})
  await prisma.coupon.deleteMany({})
  await prisma.webhookEvent.deleteMany({})
}

async function seedUsers() {
  console.log('👥 Création des utilisateurs de test...')
  
  for (const userData of TEST_USERS) {
    const user = await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: userData,
      create: userData,
    })
    console.log(`   ✅ Utilisateur créé: ${user.email} (${user.role})`)
    
    // Créer une adresse par défaut pour chaque utilisateur
    await prisma.address.create({
      data: {
        userId: user.id,
        type: 'BOTH',
        isDefault: true,
        firstName: user.firstName || 'Test',
        lastName: user.lastName || 'User',
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: 'QC',
        zipCode: faker.location.zipCode(),
        country: 'CA',
        phone: faker.phone.number()
      }
    })
  }
}

async function seedCategories() {
  console.log('📁 Création des catégories...')
  
  const categoryMap = new Map()
  
  // Créer d'abord les catégories parentes
  for (const categoryData of CATEGORIES.filter(c => !c.parentSlug)) {
    const category = await prisma.category.create({
      data: {
        slug: categoryData.slug,
        sortOrder: 0
      }
    })
    categoryMap.set(categoryData.slug, category)
    
    // Créer les traductions
    for (const [lang, translation] of Object.entries(categoryData.translations)) {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: category.id,
          language: lang.toUpperCase() as Language,
          name: translation.name,
          description: translation.description
        }
      })
    }
    console.log(`   ✅ Catégorie créée: ${categoryData.slug}`)
  }
  
  // Puis les sous-catégories
  for (const categoryData of CATEGORIES.filter(c => c.parentSlug)) {
    const parentCategory = categoryMap.get(categoryData.parentSlug)
    if (parentCategory) {
      const category = await prisma.category.create({
        data: {
          slug: categoryData.slug,
          parentId: parentCategory.id,
          sortOrder: 0
        }
      })
      categoryMap.set(categoryData.slug, category)
      
      // Créer les traductions
      for (const [lang, translation] of Object.entries(categoryData.translations)) {
        await prisma.categoryTranslation.create({
          data: {
            categoryId: category.id,
            language: lang.toUpperCase() as Language,
            name: translation.name,
            description: translation.description
          }
        })
      }
      console.log(`   ✅ Sous-catégorie créée: ${categoryData.slug}`)
    }
  }
  
  return categoryMap
}

async function seedProductAttributes() {
  console.log('🏷️  Création des attributs produits...')
  
  const attributeMap = new Map()
  
  for (const attrData of PRODUCT_ATTRIBUTES) {
    const attribute = await prisma.productAttribute.create({
      data: {
        key: attrData.key,
        inputType: 'select'
      }
    })
    attributeMap.set(attrData.key, attribute)
    
    // Créer les traductions d'attributs
    for (const [lang, translation] of Object.entries(attrData.translations)) {
      await prisma.productAttributeTranslation.create({
        data: {
          attributeId: attribute.id,
          language: lang.toUpperCase() as Language,
          name: translation.name
        }
      })
    }
    
    // Créer les valeurs d'attributs
    for (const valueData of attrData.values) {
      const attributeValue = await prisma.productAttributeValue.create({
        data: {
          attributeId: attribute.id,
          value: valueData.value
        }
      })
      
      // Créer les traductions de valeurs
      for (const [lang, translation] of Object.entries(valueData.translations)) {
        await prisma.productAttributeValueTranslation.create({
          data: {
            attributeValueId: attributeValue.id,
            language: lang.toUpperCase() as Language,
            displayName: translation.displayName
          }
        })
      }
    }
    
    console.log(`   ✅ Attribut créé: ${attrData.key}`)
  }
  
  return attributeMap
}

async function seedProducts(categoryMap: Map<string, any>, attributeMap: Map<string, any>) {
  console.log('📦 Création des produits...')
  
  const SAMPLE_PRODUCTS = [
    {
      slug: 'iphone-15-pro',
      categorySlug: 'smartphones',
      isFeatured: true,
      translations: {
        fr: {
          name: 'iPhone 15 Pro',
          description: 'Le dernier iPhone avec puce A17 Pro et caméra révolutionnaire.',
          shortDescription: 'Smartphone Apple dernière génération'
        },
        en: {
          name: 'iPhone 15 Pro',
          description: 'The latest iPhone with A17 Pro chip and revolutionary camera.',
          shortDescription: 'Latest generation Apple smartphone'
        }
      },
      variants: [
        {
          sku: 'IPH15PRO-128-BLACK',
          attributes: [
            { key: 'color', value: 'black' },
            { key: 'storage', value: '128gb' }
          ],
          price: 1299.99,
          stock: 50
        },
        {
          sku: 'IPH15PRO-256-BLACK',
          attributes: [
            { key: 'color', value: 'black' },
            { key: 'storage', value: '256gb' }
          ],
          price: 1499.99,
          stock: 30
        },
        {
          sku: 'IPH15PRO-128-WHITE',
          attributes: [
            { key: 'color', value: 'white' },
            { key: 'storage', value: '128gb' }
          ],
          price: 1299.99,
          stock: 25
        }
      ]
    },
    {
      slug: 'macbook-air-m3',
      categorySlug: 'laptops',
      isFeatured: true,
      translations: {
        fr: {
          name: 'MacBook Air M3',
          description: 'MacBook Air avec la nouvelle puce M3, ultra-mince et puissant.',
          shortDescription: 'Ordinateur portable Apple M3'
        },
        en: {
          name: 'MacBook Air M3',
          description: 'MacBook Air with the new M3 chip, ultra-thin and powerful.',
          shortDescription: 'Apple M3 laptop'
        }
      },
      variants: [
        {
          sku: 'MBA-M3-256-SILVER',
          attributes: [
            { key: 'color', value: 'white' },
            { key: 'storage', value: '256gb' }
          ],
          price: 1499.99,
          stock: 15
        }
      ]
    },
    {
      slug: 't-shirt-classic',
      categorySlug: 'mens-clothing',
      isFeatured: false,
      translations: {
        fr: {
          name: 'T-Shirt Classique',
          description: 'T-shirt en coton bio, confortable et durable.',
          shortDescription: 'T-shirt coton bio'
        },
        en: {
          name: 'Classic T-Shirt',
          description: 'Organic cotton t-shirt, comfortable and durable.',
          shortDescription: 'Organic cotton t-shirt'
        }
      },
      variants: [
        {
          sku: 'TSHIRT-CLASSIC-M-BLACK',
          attributes: [
            { key: 'color', value: 'black' },
            { key: 'size', value: 'm' }
          ],
          price: 29.99,
          stock: 100
        },
        {
          sku: 'TSHIRT-CLASSIC-L-BLACK',
          attributes: [
            { key: 'color', value: 'black' },
            { key: 'size', value: 'l' }
          ],
          price: 29.99,
          stock: 80
        },
        {
          sku: 'TSHIRT-CLASSIC-M-WHITE',
          attributes: [
            { key: 'color', value: 'white' },
            { key: 'size', value: 'm' }
          ],
          price: 29.99,
          stock: 75
        }
      ]
    }
  ]
  
  for (const productData of SAMPLE_PRODUCTS) {
    // Créer le produit
    const product = await prisma.product.create({
      data: {
        slug: productData.slug,
        status: ProductStatus.ACTIVE,
        isFeatured: productData.isFeatured
      }
    })
    
    // Créer les traductions
    for (const [lang, translation] of Object.entries(productData.translations)) {
      await prisma.productTranslation.create({
        data: {
          productId: product.id,
          language: lang.toUpperCase() as Language,
          name: translation.name,
          description: translation.description,
          shortDescription: translation.shortDescription
        }
      })
    }
    
    // Associer à la catégorie
    const category = categoryMap.get(productData.categorySlug)
    if (category) {
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: category.id
        }
      })
    }
    
    // Créer les variantes
    for (const variantData of productData.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: variantData.sku,
          weight: 0.5
        }
      })
      
      // Prix
      await prisma.productVariantPricing.create({
        data: {
          variantId: variant.id,
          priceType: 'base',
          price: variantData.price,
          currency: 'CAD'
        }
      })
      
      // Inventaire
      await prisma.productVariantInventory.create({
        data: {
          variantId: variant.id,
          stock: variantData.stock,
          lowStockThreshold: 10
        }
      })
      
      // Attributs de variante
      for (const attrData of variantData.attributes) {
        const attribute = attributeMap.get(attrData.key)
        if (attribute) {
          const attributeValue = await prisma.productAttributeValue.findFirst({
            where: {
              attributeId: attribute.id,
              value: attrData.value
            }
          })
          
          if (attributeValue) {
            await prisma.productVariantAttributeValue.create({
              data: {
                variantId: variant.id,
                attributeValueId: attributeValue.id
              }
            })
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
          sortOrder: 0
        }
      })
    }
    
    console.log(`   ✅ Produit créé: ${productData.slug}`)
  }
}

async function seedTestData() {
  console.log('🧪 Création de données de test supplémentaires...')
  
  // Paramètres système
  await prisma.systemSetting.createMany({
    data: [
      { key: 'site_name', value: 'Mon E-commerce', type: 'string' },
      { key: 'currency_default', value: 'CAD', type: 'string' },
      { key: 'tax_rate', value: '0.14975', type: 'number', description: 'Taux de taxe par défaut (QC)' },
      { key: 'free_shipping_threshold', value: '75.00', type: 'number' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean' }
    ]
  })
  
  // Coupon de test
  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 50,
      usageLimit: 100,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }
  })
  
  console.log('   ✅ Données de test créées')
}

async function main() {
  console.log('🌱 Démarrage du seed de développement...')
  console.log('')
  console.log('⚠️  IMPORTANT: Assurez-vous d\'avoir créé les utilisateurs suivants dans Clerk:')
  console.log('   - admin@test.com (avec le rôle admin)')
  console.log('   - client@test.com')
  console.log('   - marie@test.com')
  console.log('   Et mettez à jour les clerkId dans ce fichier avec les vrais IDs de Clerk.')
  console.log('')
  
  try {
    await clearDatabase()
    await seedUsers()
    const categoryMap = await seedCategories()
    const attributeMap = await seedProductAttributes()
    await seedProducts(categoryMap, attributeMap)
    await seedTestData()
    
    console.log('')
    console.log('✅ Seed terminé avec succès!')
    console.log('')
    console.log('📋 Résumé:')
    console.log(`   - ${TEST_USERS.length} utilisateurs`)
    console.log(`   - ${CATEGORIES.length} catégories`)
    console.log(`   - ${PRODUCT_ATTRIBUTES.length} attributs produits`)
    console.log('   - 3 produits avec variantes')
    console.log('   - Paramètres système et coupon de test')
    console.log('')
    console.log('🔗 Comptes de test:')
    console.log('   Admin: admin@test.com')
    console.log('   Client: client@test.com / marie@test.com')
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })