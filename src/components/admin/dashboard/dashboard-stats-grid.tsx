import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

interface StatItem {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
}

interface DashboardStatsGridProps {
  stats: StatItem[];
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="admin-card">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-gray-100 p-2">
                <Icon className="h-5 w-5 admin-text-subtle" />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600">
                {stat.title}
              </h3>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
