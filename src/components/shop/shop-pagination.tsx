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
    <div className="mt-20 vibe-flex-center gap-3">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
        const isPrev = p === currentPage - 1;
        const isNext = p === currentPage + 1;

        return (
          <Link
            key={p}
            href={`/${locale}/shop?page=${p}${categorySlug ? `&category=${categorySlug}` : ''}`}
            rel={isPrev ? 'prev' : isNext ? 'next' : undefined}
            className={cn(
              'vibe-pagination-item',
              p === currentPage
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
            )}
          >
            {p}
          </Link>
        );
      })}
    </div>
  );
}
