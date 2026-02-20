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
          <div className="rounded-lg admin-bg-subtle p-3">
            <Package className="h-6 w-6 admin-text-subtle" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('stats.total')}
            </p>
            <p className="text-2xl font-bold admin-text-main">{total}</p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4">
          <div className="rounded-lg admin-bg-success-subtle p-3">
            <div className="h-6 w-6 rounded-full admin-bg-success" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('active')}
            </p>
            <p className="text-2xl font-bold admin-text-main">{active}</p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4">
          <div className="rounded-lg admin-bg-warning-subtle p-3">
            <div className="h-6 w-6 rounded-full admin-bg-warning" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('draft')}
            </p>
            <p className="text-2xl font-bold admin-text-main">{draft}</p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4">
          <div className="rounded-lg admin-bg-info-subtle p-3">
            <Package className="h-6 w-6 admin-text-info" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('stats.stock')}
            </p>
            <p className="text-2xl font-bold admin-text-main">
              {totalStock} {t('stats.units')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
