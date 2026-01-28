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
          <label className="vibe-form-label-bold">
            {label}
            {props.required && (
              <span className="vibe-form-required ml-1">*</span>
            )}
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
        {error && <p className="vibe-form-error-bold">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
