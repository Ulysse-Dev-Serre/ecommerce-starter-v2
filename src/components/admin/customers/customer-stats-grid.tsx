import { Users, UserPlus } from 'lucide-react';

interface Stat {
  title: string;
  value: number;
  variant: 'blue' | 'green' | 'purple' | 'orange';
}

interface CustomerStatsGridProps {
  stats: Stat[];
}

const variantStyles = {
  blue: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  green: { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100' },
  purple: { icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-100' },
  orange: { icon: UserPlus, color: 'text-orange-600', bg: 'bg-orange-100' },
};

export function CustomerStatsGrid({ stats }: CustomerStatsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {stats.map(stat => {
        const { icon: Icon, color, bg } = variantStyles[stat.variant];
        return (
          <div key={stat.title} className="admin-card">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg ${bg} p-3`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
