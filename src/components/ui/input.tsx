import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            vibe-input
            ${error ? 'border-error focus:ring-error/20 focus:border-error' : ''}
            ${className || ''}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-error font-bold">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
