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
        'flex-1 flex flex-col items-center justify-center py-16 animate-in fade-in duration-500',
        className
      )}
    >
      <Loader2
        className={cn(
          'w-12 h-12 text-primary animate-spin mb-4',
          iconClassName
        )}
      />
      {message && (
        <p className="text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
