import { Package } from 'lucide-react';

interface ProductStatsGridProps {
  total: number;
  active: number;
  draft: number;
  totalStock: number;
  t: (key: string) => string;
}

export function ProductStatsGrid({
  total,
  active,
  draft,
  totalStock,
  t,
}: ProductStatsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="admin-card">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gray-100 p-3">
            <Package className="h-6 w-6 admin-text-subtle" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('stats.total')}
            </p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-green-100 p-3">
            <div className="h-6 w-6 rounded-full bg-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('active')}
            </p>
            <p className="text-2xl font-bold text-gray-900">{active}</p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-yellow-100 p-3">
            <div className="h-6 w-6 rounded-full bg-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('draft')}
            </p>
            <p className="text-2xl font-bold text-gray-900">{draft}</p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-3">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('stats.stock')}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {totalStock} {t('stats.units')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
