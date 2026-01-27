import { getTranslations, getLocale } from 'next-intl/server';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface OrderHistoryTimelineProps {
  statusHistory: any[];
}

export async function OrderHistoryTimeline({
  statusHistory,
}: OrderHistoryTimelineProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders.detail',
  });

  return (
    <div className="admin-card">
      <h3 className="admin-section-title !mb-4 text-sm">
        <Calendar className="h-4 w-4 text-gray-500" />
        {t('history')}
      </h3>
      <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
        {statusHistory.map((h, idx) => (
          <div key={h.id} className="relative pl-8">
            <div
              className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white ${
                idx === 0 ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
            <div>
              <span className="text-xs font-bold uppercase text-gray-500 block">
                {h.status}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(h.createdAt, locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              {h.comment && (
                <p className="text-xs text-gray-600 mt-1 italic">{h.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
