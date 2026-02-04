import { ProductSkeleton } from '@/components/product/product-skeleton';

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header Skeleton */}
      <div className="vibe-mb-12 border-b border-border pb-4 pb-8 space-y-4">
        <div className="h-10 w-48 bg-muted/50 vibe-card-rounded vibe-animate-pulse" />
        <div className="vibe-h-6 w-96 bg-muted/30 vibe-card-rounded vibe-animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
