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
    container: 'vibe-status-banner-info-soft',
    icon: <Info className="vibe-icon-sm" />,
  },
  success: {
    container: 'vibe-status-banner-success-soft vibe-text-success',
    icon: <CheckCircle className="vibe-icon-sm" />,
  },
  warning: {
    container: 'vibe-status-banner-warning-soft',
    icon: <TriangleAlert className="vibe-icon-sm" />,
  },
  error: {
    container: 'vibe-status-banner-error-soft vibe-text-error',
    icon: <AlertCircle className="vibe-icon-sm" />,
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
        'vibe-flex-gap-3 vibe-p-4 vibe-border vibe-card-rounded',
        container,
        className
      )}
    >
      <div className="vibe-mt-0-5 vibe-flex-shrink-0">{icon}</div>
      <div className="vibe-flex-1">
        {title && (
          <h4 className="vibe-text-bold vibe-mb-1 vibe-leading-tight">
            {title}
          </h4>
        )}
        <div className="vibe-text-sm vibe-opacity-90 vibe-leading-relaxed vibe-text-medium">
          {children}
        </div>
      </div>
    </div>
  );
}
