import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingStateProps {
  className?: string;
  iconClassName?: string;
  message?: string;
}

export function LoadingState({
  className,
  iconClassName,
  message,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex-1 vibe-flex-center flex flex-col vibe-py-16 duration-500',
        className
      )}
    >
      <Loader2
        className={cn(
          'vibe-w-12 vibe-h-12 text-primary vibe-animate-spin mb-4',
          iconClassName
        )}
      />
      {message && (
        <p className="text-muted-foreground vibe-animate-pulse">{message}</p>
      )}
    </div>
  );
}
