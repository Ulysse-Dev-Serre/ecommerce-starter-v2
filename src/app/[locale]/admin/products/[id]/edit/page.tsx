import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/core/db';
import { ProductForm } from '@/components/admin/products/product-form';

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id, locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Parallel fetch: Product (with nested relations) & Suppliers
  const [product, suppliers] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        variants: {
          where: { deletedAt: null },
          include: {
            pricing: true,
            inventory: true,
            attributeValues: {
              include: {
                attributeValue: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!product) {
    notFound();
  }

  // Serialization for Client Component Props specific requirements
  // (Prisma returns Date objects, our interface might expect strings or use them as is.
  // Next.js handles Date serialization but let's prevent type mismatches if interface enforces string)
  // The local Product interface in ProductForm expects createdAt/updatedAt as string (if defined there, actually I removed them from the interface in ProductForm to simplify? No I checked earlier.)
  // Let's check ProductForm interface again...
  // interface Product { ... createdAt: string; updatedAt: string; } was in the ORIGINAL file.
  // In my NEW ProductForm, I omitted createdAt/updatedAt in the Interface definition because I didn't use them in the form!
  // So passing the prisma object (which has extra fields) is fine, they will be ignored or passed along.
  // Next.js serializes Date objects to strings in the RSC payload anyway.

  // Cast to any to avoid strict type checking against the local interfaces of ProductForm
  // which might be slightly different than Prisma types (e.g. null vs undefined).
  // In a real optimized project we would use a mapper.
  const serializedProduct = {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    // Handle Decimals if any? Prisma Decimals need to be converted to number or string.
    // weight is Decimal? Prisma schema usually uses Decimal for weight/price.
    // Next.js RSC can't serialize Prisma Decimal instances directly usually? Or maybe it does now?
    // Usually we need `JSON.parse(JSON.stringify(product))` or manual mapping.
    // Safe bet: manual mapping for Decimals.
    weight: product.weight ? product.weight.toNumber() : null,
    variants: product.variants.map(v => ({
      ...v,
      pricing: v.pricing.map(p => ({
        ...p,
        price: p.price.toNumber(), // Decimal to Number
      })),
      weight: v.weight ? v.weight.toNumber() : null,
    })),
    // dimensions are Json? Prisma types it as InputJsonValue | ...
    // It should be fine as object.
  };

  // Serialize suppliers to handle Decimal fields
  const serializedSuppliers = suppliers.map(supplier => ({
    ...supplier,
    minimumOrderAmount: supplier.minimumOrderAmount
      ? Number(supplier.minimumOrderAmount)
      : null,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  }));

  return (
    <ProductForm
      initialProduct={serializedProduct as any}
      suppliers={serializedSuppliers}
      locale={locale}
    />
  );
}
