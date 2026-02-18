import { getTranslations, getLocale } from 'next-intl/server';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

import { OrderStatusHistory } from '@/generated/prisma';

interface OrderHistoryTimelineProps {
  statusHistory: OrderStatusHistory[];
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
      <h2 className="admin-section-title !mb-4 text-sm">
        <Calendar className="h-4 w-4 admin-text-subtle" />
        {t('history')}
      </h2>
      <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:admin-bg-subtle">
        {statusHistory.map((h, idx) => (
          <div key={h.id} className="relative pl-8">
            <div
              className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white ${
                idx === 0 ? 'bg-primary' : 'admin-bg-subtle'
              }`}
            />
            <div>
              <span className="text-xs font-bold uppercase admin-text-subtle block">
                {h.status}
              </span>
              <p className="text-xs admin-text-subtle mt-1 opacity-70">
                {formatDate(h.createdAt, locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              {h.comment && (
                <p className="text-xs admin-text-main mt-1 italic">
                  {h.comment}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
