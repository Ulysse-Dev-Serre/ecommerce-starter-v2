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
        'vibe-flex-1 vibe-flex-center vibe-flex-col vibe-py-16 vibe-animate-fade-in',
        className
      )}
    >
      <Loader2
        className={cn(
          'vibe-w-12 vibe-h-12 vibe-text-primary vibe-animate-spin vibe-mb-4',
          iconClassName
        )}
      />
      {message && (
        <p className="vibe-text-muted vibe-animate-pulse">{message}</p>
      )}
    </div>
  );
}
