import { ProductSkeleton } from '@/components/product/product-skeleton';

export default function ShopLoading() {
  return (
    <div className="vibe-layout-container vibe-section-py">
      {/* Header Skeleton */}
      <div className="mb-12 border-b border-border pb-8 space-y-4">
        <div className="h-10 w-48 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-6 w-96 bg-muted/30 rounded-lg animate-pulse" />
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
