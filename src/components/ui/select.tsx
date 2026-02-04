import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="vibe-full">
        {label && (
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground vibe-mb-1-5">
            {label}
            {props.required && <span className="text-error ml-1 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'vibe-input vibe-appearance-none vibe-bg-select vibe-pr-10',
            error && 'vibe-border-error focus:ring-error/20 focus:border-error',
            className
          )}
          {...props}
        >
          <option value="" disabled hidden>
            {props.title || 'Select option'}
          </option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 vibe-text-xs text-error font-bold">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
