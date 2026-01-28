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
          <label className="vibe-form-label">
            {label}{' '}
            {required && <span className="vibe-form-required ml-1">*</span>}
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
        {error && <p className="vibe-form-error">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
