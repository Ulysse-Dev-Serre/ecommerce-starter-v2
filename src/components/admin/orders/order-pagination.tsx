import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

interface OrderPaginationProps {
  pageNum: number;
  limitNum: number;
  total: number;
  totalPages: number;
  status?: string;
  search?: string;
}

export async function OrderPagination({
  pageNum,
  limitNum,
  total,
  totalPages,
  status,
  search,
}: OrderPaginationProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders',
  });

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        {t('pagination.showing')}{' '}
        <span className="font-medium">{(pageNum - 1) * limitNum + 1}</span>{' '}
        {t('pagination.to')}{' '}
        <span className="font-medium font-bold">
          {Math.min(pageNum * limitNum, total)}
        </span>{' '}
        {t('pagination.of')}{' '}
        <span className="font-medium font-bold">{total}</span>{' '}
        {t('pagination.orders')}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <Link
            key={p}
            href={`?page=${p}${status ? `&status=${status}` : ''}${
              search ? `&search=${search}` : ''
            }`}
            className={`px-4 py-2 rounded transition-colors ${
              p === pageNum
                ? 'bg-primary text-white font-bold'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {p}
          </Link>
        ))}
      </div>
    </div>
  );
}
