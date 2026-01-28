import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface ShopPaginationProps {
  totalPages: number;
  currentPage: number;
  locale: string;
  categorySlug?: string;
}

export function ShopPagination({
  totalPages,
  currentPage,
  locale,
  categorySlug,
}: ShopPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="vibe-mt-20 vibe-flex-center vibe-gap-3">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <Link
          key={p}
          href={`/${locale}/shop?page=${p}${categorySlug ? `&category=${categorySlug}` : ''}`}
          className={cn(
            'vibe-pagination-item',
            p === currentPage
              ? 'vibe-pagination-active'
              : 'vibe-pagination-inactive'
          )}
        >
          {p}
        </Link>
      ))}
    </div>
  );
}
