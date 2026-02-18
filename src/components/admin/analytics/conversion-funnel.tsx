'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

interface ConversionFunnelProps {
  data: FunnelData[];
  labels: {
    visitors: string;
  };
}

const COLORS = [
  'var(--admin-chart-1)',
  'var(--admin-chart-2)',
  'var(--admin-chart-3)',
  'var(--admin-chart-4)',
  'var(--admin-chart-5)',
];

export function ConversionFunnel({ data, labels }: ConversionFunnelProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="stage"
            type="category"
            axisLine={false}
            tickLine={false}
            width={100}
            tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            formatter={(
              value: number | string | undefined,
              _name: number | string | undefined,
              entry: { payload?: FunnelData }
            ) => [
              `${value ?? 0} (${entry?.payload?.percentage ?? 0}%)`,
              labels.visitors,
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
