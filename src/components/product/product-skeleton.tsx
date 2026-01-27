import { Skeleton } from '@/components/ui/skeleton';

export function ProductSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[250px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="pt-4 mt-auto">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
