import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { prisma } from '@/lib/db/prisma';
import { LogisticsClient } from '@/components/admin/logistics/logistics-client';

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

  // Fetch Suppliers (Locations)
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LogisticsClient suppliers={suppliers} locale={locale} />
    </NextIntlClientProvider>
  );
}
