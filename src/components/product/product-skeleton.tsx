import { Skeleton } from '@/components/ui/skeleton';

export function ProductSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="vibe-h-250 vibe-w-full vibe-card-rounded" />
      <div className="vibe-stack-y-2">
        <Skeleton className="vibe-h-4 w-3/4" />
        <Skeleton className="vibe-h-4 w-1/2" />
      </div>
      <div className="vibe-pt-4 vibe-mt-auto">
        <Skeleton className="vibe-h-8 vibe-w-1-3 mb-4" />
        <Skeleton className="h-10 vibe-w-full vibe-card-rounded" />
      </div>
    </div>
  );
}
