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
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all
            placeholder:text-muted-foreground/50
            focus:ring-2 focus:ring-primary focus:border-primary
            disabled:opacity-50 disabled:bg-muted
            ${error ? 'border-error ring-1 ring-error' : 'border-border'}
            ${className || ''}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-error font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
