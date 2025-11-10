import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Orders',
      value: '2,350',
      change: '+180.1%',
      trend: 'up',
      icon: ShoppingCart,
    },
    {
      title: 'Products',
      value: '145',
      change: '+12.5%',
      trend: 'up',
      icon: Package,
    },
    {
      title: 'Customers',
      value: '1,234',
      change: '+19%',
      trend: 'up',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your ecommerce performance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-gray-100 p-2">
                  <Icon className="h-5 w-5 text-gray-700" />
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

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart placeholder */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">Chart placeholder</p>
          </div>
        </div>

        {/* Recent orders placeholder */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-gray-100 pb-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Order #{1000 + i}
                  </p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
