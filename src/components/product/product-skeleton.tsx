import { Skeleton } from '@/components/ui/skeleton';

export function ProductSkeleton() {
  return (
    <div className="vibe-flex-col vibe-stack-y-3">
      <Skeleton className="vibe-h-250 vibe-w-full vibe-card-rounded" />
      <div className="vibe-stack-y-2">
        <Skeleton className="vibe-h-4 vibe-w-3-4" />
        <Skeleton className="vibe-h-4 vibe-w-1-2" />
      </div>
      <div className="vibe-pt-4 vibe-mt-auto">
        <Skeleton className="vibe-h-8 vibe-w-1-3 vibe-mb-4" />
        <Skeleton className="vibe-h-10 vibe-w-full vibe-card-rounded" />
      </div>
    </div>
  );
}
