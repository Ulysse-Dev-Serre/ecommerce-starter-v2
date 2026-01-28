import { ProductSkeleton } from '@/components/product/product-skeleton';

export default function ShopLoading() {
  return (
    <div className="vibe-layout-container vibe-section-py">
      {/* Header Skeleton */}
      <div className="vibe-mb-12 vibe-section-divider-bottom vibe-pb-8 vibe-stack-y-4">
        <div className="vibe-h-10 vibe-w-48 vibe-bg-muted-50 vibe-card-rounded vibe-animate-pulse" />
        <div className="vibe-h-6 vibe-w-96 vibe-bg-muted-30 vibe-card-rounded vibe-animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="vibe-grid-responsive-shop">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
