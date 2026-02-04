import React, { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, required, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {label}{' '}
            {required && <span className="text-error ml-1 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'vibe-input',
            error ? 'border-error focus:ring-error' : '',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
