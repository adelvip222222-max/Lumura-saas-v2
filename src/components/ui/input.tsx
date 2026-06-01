// src/components/ui/input.tsx
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string | undefined;
  helperText?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, rightIcon, ...props }, ref) => {
    return (
      <div>
        {label && <label className="block text-sm font-medium text-foreground mb-2">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            {...props}
            className={`block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 text-sm placeholder:opacity-60 ${className} ${error ? 'ring-1 ring-red-500' : ''}`}
          />
          {rightIcon && <div className="absolute inset-y-0 right-2 flex items-center">{rightIcon}</div>}
        </div>
        {helperText && <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
