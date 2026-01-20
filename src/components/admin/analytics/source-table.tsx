'use client';

interface SourceData {
  source: string;
  visitors: number;
  orders: number;
  revenue: number;
  conversionRate: string;
}

interface SourceTableProps {
  data: SourceData[];
}

export function SourceTable({ data }: SourceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-400 font-medium">
            <th className="py-3 px-4">Source</th>
            <th className="py-3 px-4 text-right">Visitors</th>
            <th className="py-3 px-4 text-right">Orders</th>
            <th className="py-3 px-4 text-right">Revenue</th>
            <th className="py-3 px-4 text-right">Conv. Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr
              key={item.source}
              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900">
                {item.source || 'Direct / Organic'}
              </td>
              <td className="py-3 px-4 text-right text-gray-600">
                {item.visitors}
              </td>
              <td className="py-3 px-4 text-right text-gray-600">
                {item.orders}
              </td>
              <td className="py-3 px-4 text-right text-gray-900 font-medium">
                ${item.revenue.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-right">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {item.conversionRate}%
                </span>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-500">
                No data available for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
