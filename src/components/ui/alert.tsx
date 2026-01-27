import React from 'react';
import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react';

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
    container: 'bg-success/5 border-success/20 text-success',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  warning: {
    container: 'bg-warning/5 border-warning/20 text-warning',
    icon: <TriangleAlert className="h-5 w-5" />,
  },
  error: {
    container: 'bg-error/5 border-error/20 text-error',
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
      className={`flex gap-3 p-4 rounded-xl border ${container} ${className} animate-in fade-in slide-in-from-top-1 duration-300`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1">
        {title && <h4 className="font-bold mb-1 leading-tight">{title}</h4>}
        <div className="text-sm opacity-90 leading-relaxed font-medium">
          {children}
        </div>
      </div>
    </div>
  );
}
