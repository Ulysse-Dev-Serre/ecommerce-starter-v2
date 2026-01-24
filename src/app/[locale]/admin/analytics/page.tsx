import { prisma } from '@/lib/db/prisma';
import { ConversionFunnel } from '@/components/admin/analytics/conversion-funnel';
import { SourceTable } from '@/components/admin/analytics/source-table';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface AnalyticsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.analytics',
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Fetch Funnel Data (Unique users per stage)
  const [sessions, productViews, cartAdds, checkouts, purchases] =
    await Promise.all([
      prisma.analyticsEvent.count({
        where: { eventType: 'page_view', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'view_item', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'add_to_cart', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: 'begin_checkout',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELLED' },
        },
      }),
    ]);

  const funnelData = [
    { stage: t('stages.sessions'), count: sessions, percentage: 100 },
    {
      stage: t('stages.productViews'),
      count: productViews,
      percentage:
        sessions > 0 ? Math.round((productViews / sessions) * 100) : 0,
    },
    {
      stage: t('stages.carts'),
      count: cartAdds,
      percentage: sessions > 0 ? Math.round((cartAdds / sessions) * 100) : 0,
    },
    {
      stage: t('stages.checkouts'),
      count: checkouts,
      percentage: sessions > 0 ? Math.round((checkouts / sessions) * 100) : 0,
    },
    {
      stage: t('stages.purchases'),
      count: purchases,
      percentage: sessions > 0 ? Math.round((purchases / sessions) * 100) : 0,
    },
  ];

  // 2. Fetch Source Data
  const sourceStats = await prisma.order.groupBy({
    by: ['utmSource'],
    _count: { _all: true },
    _sum: { totalAmount: true },
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  const sourceVisitors = await prisma.analyticsEvent.groupBy({
    by: ['utmSource'],
    _count: { _all: true },
    where: { eventType: 'page_view', createdAt: { gte: thirtyDaysAgo } },
  });

  const tableData = sourceVisitors
    .map(v => {
      const stats = sourceStats.find(s => s.utmSource === v.utmSource);
      const visitors = v._count._all;
      const orders = stats?._count._all || 0;
      const revenue = Number(stats?._sum.totalAmount || 0);
      return {
        source:
          v.utmSource ||
          (locale === 'fr' ? 'Direct / Organique' : 'Direct / Organic'),
        visitors,
        orders,
        revenue,
        conversionRate:
          visitors > 0 ? ((orders / visitors) * 100).toFixed(1) : '0',
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">{t('title')}</h1>
        <p className="admin-page-subtitle">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="admin-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 underline decoration-sky-500/30 underline-offset-8">
            {t('conversionFunnel')}
          </h3>
          <ConversionFunnel data={funnelData} />
        </div>

        {/* Source breakdown */}
        <div className="admin-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 underline decoration-sky-500/30 underline-offset-8">
            {t('sourcePerformance')}
          </h3>
          <SourceTable data={tableData} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="admin-card">
          <p className="text-sm font-medium text-gray-500">
            {t('overallConversion')}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {sessions > 0 ? ((purchases / sessions) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="admin-card">
          <p className="text-sm font-medium text-gray-500">
            {t('avgOrderValue')}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            $
            {purchases > 0
              ? (
                  tableData.reduce((acc, curr) => acc + curr.revenue, 0) /
                  purchases
                ).toFixed(2)
              : 0}
          </p>
        </div>
        <div className="admin-card">
          <p className="text-sm font-medium text-gray-500">
            {t('totalSessions')}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{sessions}</p>
        </div>
      </div>
    </div>
  );
}
