import { prisma } from '@/lib/core/db';
import { ConversionFunnel } from '@/components/admin/analytics/conversion-funnel';
import { SourceTable } from '@/components/admin/analytics/source-table';
import { AnalyticsStatsGrid } from '@/components/admin/analytics/analytics-stats-grid';
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

  // 1. Fetch Funnel Data
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
        source: v.utmSource || t('sourceTable.directOrganic'),
        visitors,
        orders,
        revenue,
        conversionRate:
          visitors > 0 ? ((orders / visitors) * 100).toFixed(1) : '0',
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = tableData.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">{t('title')}</h1>
        <p className="admin-page-subtitle">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card">
          <h3 className="admin-section-title">{t('conversionFunnel')}</h3>
          <ConversionFunnel data={funnelData} />
        </div>

        <div className="admin-card">
          <h3 className="admin-section-title">{t('sourcePerformance')}</h3>
          <SourceTable data={tableData} />
        </div>
      </div>

      <AnalyticsStatsGrid
        sessions={sessions}
        purchases={purchases}
        totalRevenue={totalRevenue}
      />
    </div>
  );
}
