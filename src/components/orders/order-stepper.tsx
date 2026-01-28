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
    <div className="vibe-container vibe-bg-background">
      <div className="vibe-relative vibe-flex-between vibe-w-full">
        {['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step}
              className="vibe-flex-col vibe-items-center vibe-relative vibe-z-10"
            >
              <div
                className={cn(
                  'vibe-w-12 vibe-h-12 vibe-rounded-2xl vibe-flex-center vibe-border-2 vibe-transition-all vibe-duration-700',
                  isCompleted
                    ? 'vibe-bg-primary vibe-border-primary vibe-text-background vibe-shadow-lg-primary'
                    : 'vibe-bg-background vibe-border-border vibe-text-muted',
                  isCurrent && 'vibe-ring-4-primary-soft vibe-scale-110'
                )}
              >
                {isCompleted ? (
                  <Check className="vibe-icon-md vibe-stroke-3" />
                ) : (
                  <span className="vibe-text-lg-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'vibe-text-xs-bold-muted-caps vibe-mt-4 vibe-transition-colors',
                  isCompleted
                    ? 'vibe-text-foreground'
                    : 'vibe-text-muted vibe-opacity-50'
                )}
              >
                {labels[step]}
              </span>
            </div>
          );
        })}
        <div className="vibe-abs-h-center-top-6 vibe-w-full vibe-h-1 vibe-bg-border vibe-z-0 vibe-rounded-full" />
        <div
          className="absolute top-6 left-0 h-1 bg-primary transition-all duration-1000 -z-0 rounded-full shadow-sm"
          style={{ width: `${Math.max(0, (currentStep / 3) * 100)}%` }}
        />
      </div>
    </div>
  );
}
