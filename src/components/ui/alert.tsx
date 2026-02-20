import React from 'react';

import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variants = {
  info: {
    container: 'bg-info/5 border-info/20 text-info',
    icon: <Info className="h-5 w-5" />,
  },
  success: {
    container: 'bg-success/10 rounded-xl border border-success/20 text-success',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  warning: {
    container: 'bg-warning/5 border-warning/20 text-warning',
    icon: <TriangleAlert className="h-5 w-5" />,
  },
  error: {
    container:
      'bg-error/5 rounded-xl border border-error/20 flex flex-col text-error',
    icon: <AlertCircle className="h-5 w-5" />,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
}: AlertProps) {
  const { container, icon } = variants[variant];

  return (
    <div
      className={cn(
        'vibe-flex-gap-3 p-4 vibe-border vibe-card-rounded',
        container,
        className
      )}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        {title && (
          <h4 className="font-bold vibe-mb-1 vibe-leading-tight">{title}</h4>
        )}
        <div className="vibe-text-sm vibe-opacity-90 leading-relaxed font-medium">
          {children}
        </div>
      </div>
    </div>
  );
}
