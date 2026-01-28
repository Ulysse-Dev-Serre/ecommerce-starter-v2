import { prisma } from '@/lib/core/db';
import { ProductForm } from '@/components/admin/products/product-form';

export const dynamic = 'force-dynamic';

interface NewProductPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { locale } = await params;

  // Fetch Suppliers for shipping origin selection
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize suppliers
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
      initialProduct={null}
      suppliers={serializedSuppliers}
      locale={locale}
    />
  );
}
