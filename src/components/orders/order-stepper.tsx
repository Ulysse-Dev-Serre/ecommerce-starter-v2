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
      <div className="relative flex justify-between w-full">
        {['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-700',
                  isCompleted
                    ? 'vibe-bg-primary vibe-border-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-background border-border text-muted-foreground',
                  isCurrent && 'ring-4 ring-primary/20 scale-110'
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 stroke-[3]" />
                ) : (
                  <span className="font-bold text-lg">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-bold mt-4 uppercase tracking-tighter transition-colors',
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
        <div className="absolute top-6 left-0 w-full h-1 bg-border -z-0 rounded-full" />
        <div
          className="absolute top-6 left-0 h-1 bg-primary transition-all duration-1000 -z-0 rounded-full shadow-sm"
          style={{ width: `${Math.max(0, (currentStep / 3) * 100)}%` }}
        />
      </div>
    </div>
  );
}
