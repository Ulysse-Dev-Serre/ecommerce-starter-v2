import { Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface OrderStepperProps {
  status: string;
  labels: Record<string, string>;
}

export function OrderStepper({ status, labels }: OrderStepperProps) {
  const currentStep = ['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].indexOf(
    status
  );

  return (
    <div className="vibe-container bg-background">
      <div className="relative vibe-flex-between vibe-w-full">
        {['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step}
              className="flex flex-col vibe-items-center relative z-10"
            >
              <div
                className={cn(
                  'vibe-w-12 vibe-h-12 vibe-rounded-2xl vibe-flex-center vibe-border-2 transition-all duration-300 duration-700',
                  isCompleted
                    ? 'vibe-bg-primary vibe-border-primary vibe-text-background vibe-shadow-lg-primary'
                    : 'bg-background vibe-border-border text-muted-foreground',
                  isCurrent && 'ring-4 ring-primary/10 scale-110'
                )}
              >
                {isCompleted ? (
                  <Check className="h-16 w-16 stroke-[3px]" />
                ) : (
                  <span className="vibe-text-lg-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4 transition-colors',
                  isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground opacity-50'
                )}
              >
                {labels[step]}
              </span>
            </div>
          );
        })}
        <div className="vibe-abs-h-center-top-6 vibe-w-full h-1 vibe-bg-border vibe-z-0 vibe-rounded-full" />
        <div
          className="absolute top-6 left-0 h-1 bg-primary transition-all duration-1000 -z-0 rounded-full shadow-sm"
          style={{ width: `${Math.max(0, (currentStep / 3) * 100)}%` }}
        />
      </div>
    </div>
  );
}
