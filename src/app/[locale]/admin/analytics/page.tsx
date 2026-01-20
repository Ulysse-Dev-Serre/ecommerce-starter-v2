import { prisma } from '@/lib/db/prisma';
import { ConversionFunnel } from '@/components/admin/analytics/conversion-funnel';
import { SourceTable } from '@/components/admin/analytics/source-table';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Fetch Funnel Data (Unique users per stage)
  const [sessions, productViews, cartAdds, checkouts, purchases] =
    await Promise.all([
      prisma.analyticsEvent.count({
        where: { eventType: 'page_view', createdAt: { gte: thirtyDaysAgo } },
        // Note: Prisma doesn't support easy distinct count in count(), so we'd normally use groupBY
        // but for simplicity in this V1 and small data, we'll fetch unique counts for stages
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
    { stage: 'Sessions', count: sessions, percentage: 100 },
    {
      stage: 'Produits vus',
      count: productViews,
      percentage:
        sessions > 0 ? Math.round((productViews / sessions) * 100) : 0,
    },
    {
      stage: 'Paniers',
      count: cartAdds,
      percentage: sessions > 0 ? Math.round((cartAdds / sessions) * 100) : 0,
    },
    {
      stage: 'Checkouts',
      count: checkouts,
      percentage: sessions > 0 ? Math.round((checkouts / sessions) * 100) : 0,
    },
    {
      stage: 'Achats',
      count: purchases,
      percentage: sessions > 0 ? Math.round((purchases / sessions) * 100) : 0,
    },
  ];

  // 2. Fetch Source Data
  // We'll group orders by utmSource
  const sourceStats = await prisma.order.groupBy({
    by: ['utmSource'],
    _count: { _all: true },
    _sum: { totalAmount: true },
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // To get visitors per source, we use AnalyticsEvent
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
        source: v.utmSource || 'Direct / Organic',
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
        <h1 className="text-3xl font-bold text-gray-900">Analytique</h1>
        <p className="mt-2 text-sm text-gray-600">
          Suivez la performance de votre boutique et vos conversions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 underline decoration-sky-500/30 underline-offset-8">
            Tunnel de conversion (30j)
          </h3>
          <ConversionFunnel data={funnelData} />
        </div>

        {/* Source breakdown */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 underline decoration-sky-500/30 underline-offset-8">
            Performance par source (30j)
          </h3>
          <SourceTable data={tableData} />
        </div>
      </div>

      {/* Placeholder for more advanced metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Taux de conversion global
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {sessions > 0 ? ((purchases / sessions) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Valeur moyenne de commande
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
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Sessions totales (30j)
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{sessions}</p>
        </div>
      </div>
    </div>
  );
}
