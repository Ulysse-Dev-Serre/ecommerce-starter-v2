import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { prisma } from '@/lib/core/db';
import { LogisticsClient } from '@/components/admin/logistics/logistics-client';
import { AdminSupplier } from '@/lib/types/domain/logistics';

interface LogisticsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LogisticsPage({
  params,
}: LogisticsPageProps): Promise<React.ReactElement> {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Fetch messages (inferred from request locale)
  const messages = await getMessages();

  // Fetch Suppliers (Locations) and serialize Decimals
  const rawSuppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  const suppliers = rawSuppliers.map(s => ({
    ...s,
    minimumOrderAmount: s.minimumOrderAmount.toNumber(),
  }));

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LogisticsClient
        suppliers={suppliers as unknown as AdminSupplier[]}
        locale={locale}
      />
    </NextIntlClientProvider>
  );
}
