import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { prisma } from '@/lib/core/db';
import { getProductForAdmin } from '@/lib/services/products';

import {
  ProductForm,
  AdminProduct,
} from '@/components/admin/products/product-form';

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
    getProductForAdmin(id),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!product) {
    notFound();
  }

  // Serialization for Client Component Props specific requirements
  const serializedProduct = {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    weight: product.weight ? product.weight.toNumber() : null,
    variants: product.variants.map(v => ({
      ...v,
      pricing: v.pricing.map(p => ({
        ...p,
        price: p.price.toNumber(), // Decimal to Number
      })),
      weight: v.weight ? v.weight.toNumber() : null,
    })),
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
      initialProduct={serializedProduct as AdminProduct}
      suppliers={serializedSuppliers}
      locale={locale}
    />
  );
}
